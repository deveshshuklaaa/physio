// Layer 2: G4 (authz state not persisted in OTP records), G5 (OTP TTL / expiry / cooldown / attempts). Staging only.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md).
// Env: L2_SKIP_SLOW=1 skips the ~90s functional TTL test.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const H = require("./layer2_helpers");
const { OTP_EXPIRY_SECONDS, RESEND_COOLDOWN_SECONDS, OTP_MAX_ATTEMPTS } = H.policy;

before(() => H.setup());
after(() => H.finish());

const KNOWN = "123456", WRONG = "654321";
const noCreds = (b) => !(b && typeof b === "object" && (b.token || b.resetToken));
const is4xx = (s) => s >= 400 && s < 500;

// Login via the real route, adopt the challenge doc so teardown deletes it, set a known OTP (we own this fixture's challenge).
async function login(route, who) {
  const r = await H.api("POST", route, { json: { email: who.email, password: who.password } });
  assert.strictEqual(r.status, 200, `login ${route} -> ${r.status} ${JSON.stringify(r.body).slice(0, 160)} (staging must run NODE_ENV=development or have working SMTP; the route deletes the OTP when the email send fails)`);
  const t = await H.otpTarget("login");
  await H.tagWhere(t.name, { challengeId: r.body.challengeId });
  await H.db().collection(t.name).updateOne({ challengeId: r.body.challengeId, __testRun: H.RUN }, { $set: { otpHash: await bcrypt.hash(KNOWN, 4) } });
  return { challengeId: r.body.challengeId, coll: t.name, res: r.body };
}
const verifyLogin = (challengeId, otp) => H.api("POST", "/api/auth/verify-otp", { json: { challengeId, otp } });
const verifyReset = (challengeId, otp) => H.api("POST", "/api/password-reset/verify", { json: { challengeId, otp } });

// ---------------- G4 ----------------
const IDENTITY = new Set(["id", "fullName", "email", "role", "mustChangePassword"]);

test("G4 raw admin challenge carries no adminLevel/permissions; userData is identity only", async () => {
  const a = await H.mkAdmin({ level: "ADMIN", perms: { canManageAdmins: true } });
  const { challengeId, coll } = await login("/api/admin/login", a);
  const raw = await H.db().collection(coll).findOne({ challengeId });
  assert(raw?.userData, "challenge has no userData");
  for (const k of ["adminLevel", "permissions"]) {
    assert(!(k in raw.userData), `loginotps.userData.${k} is persisted (stale authz snapshot): ${JSON.stringify(raw.userData[k])}`);
    assert(!(k in (raw.authPayload || {})), `authPayload.${k} is persisted`);
  }
  const extra = Object.keys(raw.userData).filter((k) => !IDENTITY.has(k));
  assert.deepStrictEqual(extra, [], `userData carries non-identity keys: ${extra}`);
});

test("G4 REVOCATION: permission revoked between OTP issue and verify is reflected in payload and in the next authorized request", async () => {
  const a = await H.mkAdmin({ level: "ADMIN", perms: { canManageAdmins: true } });
  // control: permission really grants access before revocation
  assert.strictEqual((await H.api("GET", "/api/admin/management", { token: a.token })).status, 200, "control failed: admin with canManageAdmins denied");

  const { challengeId } = await login("/api/admin/login", a); // issued while permission is held
  await H.setPerm(a.id, "canManageAdmins", false);             // revoke
  const v = await verifyLogin(challengeId, KNOWN);
  assert.strictEqual(v.status, 200, `verify -> ${v.status} ${JSON.stringify(v.body).slice(0, 160)}`);

  assert.notStrictEqual(v.body.user?.permissions?.canManageAdmins, true, "verify payload still reports revoked canManageAdmins=true (stale snapshot from OTP record)");
  assert(!("adminLevel" in (v.body.user || {})) || v.body.user.adminLevel !== "SUPER_ADMIN", "payload escalated adminLevel");
  const after = await H.api("GET", "/api/admin/management", { token: v.body.token });
  assert.strictEqual(after.status, 403, `post-verify request with the issued token -> ${after.status}, expected 403 (permission revoked)`);
});

test("G4 patient login challenge: userData is identity only", async () => {
  const p = await H.mkPatient();
  const { challengeId, coll } = await login("/api/auth/login", p);
  const raw = await H.db().collection(coll).findOne({ challengeId });
  const extra = Object.keys(raw.userData || {}).filter((k) => !IDENTITY.has(k));
  assert.deepStrictEqual(extra, [], `patient userData carries non-identity keys: ${extra}`);
});

// ---------------- G5 ----------------
async function ttlNames() {
  return (await H.collNames()).includes("otpchallenges") ? ["otpchallenges"] : ["loginotps", "passwordresetotps"];
}

test("G5 expiresAt_1 exists with expireAfterSeconds === 0 on every OTP collection", async () => {
  for (const n of await ttlNames()) {
    const ix = (await H.db().collection(n).indexes()).find((i) => i.name === "expiresAt_1");
    assert(ix, `${n}: no expiresAt_1 index`);
    assert.deepStrictEqual(ix.key, { expiresAt: 1 }, `${n}: wrong key`);
    assert.strictEqual(ix.expireAfterSeconds, 0, `${n}: expireAfterSeconds is ${ix.expireAfterSeconds}, not 0`);
  }
});

test("G5 [EXPECTED-FAIL until Phase 5] otpchallenges exists with TTL expireAfterSeconds 0", async () => {
  assert((await H.collNames()).includes("otpchallenges"), "otpchallenges collection does not exist (Phase 5 not shipped)");
  const ix = (await H.db().collection("otpchallenges").indexes()).find((i) => i.name === "expiresAt_1");
  assert.strictEqual(ix?.expireAfterSeconds, 0, "otpchallenges lost the TTL on merge");
});

test("G5 [SLOW ~90s] functional TTL: expired challenge is removed by the sweeper", { timeout: 130000, skip: process.env.L2_SKIP_SLOW === "1" }, async () => {
  const p = await H.mkPatient();
  const seeded = [];
  for (const purpose of ["login", "password_reset"]) seeded.push(await H.seedChallenge(purpose, { userId: p.id, expiresAt: new Date(Date.now() - 120000) }));
  const deadline = Date.now() + 90000;
  let alive = seeded;
  while (alive.length && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const still = [];
    for (const s of alive) if (await H.db().collection(s.coll).countDocuments({ challengeId: s.challengeId })) still.push(s);
    alive = still;
  }
  assert.strictEqual(alive.length, 0, `not swept within 90s: ${alive.map((s) => s.coll)} (TTL index wrong or monitor disabled)`);
});

for (const [label, purpose, verify] of [["login", "login", verifyLogin], ["password_reset", "password_reset", verifyReset]]) {
  test(`G5 ${label}: expired-but-unswept challenge is REJECTED at verify (control: unexpired one passes)`, async () => {
    const p = await H.mkPatient();
    const ok = await H.seedChallenge(purpose, { userId: p.id });
    const good = await verify(ok.challengeId, ok.otp);
    assert.strictEqual(good.status, 200, `control failed: valid challenge rejected: ${good.status} ${JSON.stringify(good.body).slice(0, 120)}`);

    const dead = await H.seedChallenge(purpose, { userId: p.id, expiresAt: new Date(Date.now() - 5000) });
    const r = await verify(dead.challengeId, dead.otp);
    assert(is4xx(r.status), `expired challenge -> ${r.status}`);
    assert(noCreds(r.body), "expired challenge yielded credentials");
  });

  test(`G5 ${label}: attempts cap holds (${OTP_MAX_ATTEMPTS} wrong, then even the correct OTP fails)`, async () => {
    const p = await H.mkPatient();
    const c = await H.seedChallenge(purpose, { userId: p.id });
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      const r = await verify(c.challengeId, WRONG);
      assert(is4xx(r.status), `wrong attempt ${i + 1} -> ${r.status}`);
    }
    const r = await verify(c.challengeId, c.otp);
    assert(is4xx(r.status) && noCreds(r.body), `correct OTP after cap accepted: ${r.status}`);

    const capped = await H.seedChallenge(purpose, { userId: p.id, attempts: OTP_MAX_ATTEMPTS });
    const r2 = await verify(capped.challengeId, capped.otp);
    assert(is4xx(r2.status) && noCreds(r2.body), `challenge already at cap accepted the correct OTP: ${r2.status}`);
  });
}

test("G5 login: expiry from policy, 30s cooldown on re-login and on resend-otp", async () => {
  const p = await H.mkPatient();
  const first = await login("/api/auth/login", p);
  assert.strictEqual(first.res.expiresInSeconds, OTP_EXPIRY_SECONDS, "expiresInSeconds != config/otpPolicy.OTP_EXPIRY_SECONDS");
  const raw = await H.db().collection(first.coll).findOne({ challengeId: first.challengeId });
  const span = (raw.expiresAt - raw.createdAt) / 1000;
  assert(Math.abs(span - OTP_EXPIRY_SECONDS) <= 5, `stored expiry window ${span}s, policy ${OTP_EXPIRY_SECONDS}s`);

  const again = await H.api("POST", "/api/auth/login", { json: { email: p.email, password: p.password } });
  assert.strictEqual(again.status, 429, `immediate re-login -> ${again.status}`);
  assert(again.body.remainingSeconds >= 1 && again.body.remainingSeconds <= RESEND_COOLDOWN_SECONDS, `remainingSeconds ${again.body.remainingSeconds}`);

  const rs = await H.api("POST", "/api/auth/resend-otp", { json: { challengeId: first.challengeId } });
  assert.strictEqual(rs.status, 429, `immediate resend -> ${rs.status}`);
  assert(rs.body.remainingSeconds <= RESEND_COOLDOWN_SECONDS);
});

test("G5 password_reset: 30s cooldown on repeated request", async () => {
  const p = await H.mkPatient();
  const body = { role: "patient", email: p.email };
  const a = await H.api("POST", "/api/password-reset/request", { json: body });
  assert.strictEqual(a.status, 200, `first request -> ${a.status} ${JSON.stringify(a.body).slice(0, 160)} (staging email?)`);
  await H.tagUser(p.id); // adopt the challenge it just created (userId = fixture)
  const b = await H.api("POST", "/api/password-reset/request", { json: body });
  assert.strictEqual(b.status, 429, `immediate second request -> ${b.status}`);
  assert(b.body.remainingSeconds >= 1 && b.body.remainingSeconds <= RESEND_COOLDOWN_SECONDS);
});

test("G5 [EXPECTED-FAIL until Phase 5] cross-purpose redemption is impossible both ways", async () => {
  assert((await H.collNames()).includes("otpchallenges"), "otpchallenges does not exist (Phase 5 not shipped); purpose separation untestable");
  const p = await H.mkPatient();
  const lc = await H.seedChallenge("login", { userId: p.id });
  const r1 = await verifyReset(lc.challengeId, lc.otp);
  assert(is4xx(r1.status) && noCreds(r1.body), `login challenge redeemed on password-reset: ${r1.status}`);
  const rc = await H.seedChallenge("password_reset", { userId: p.id });
  const r2 = await verifyLogin(rc.challengeId, rc.otp);
  assert(is4xx(r2.status) && noCreds(r2.body), `password_reset challenge redeemed on login: ${r2.status}`);
  const ok = await H.seedChallenge("login", { userId: p.id });
  assert.strictEqual((await verifyLogin(ok.challengeId, ok.otp)).status, 200, "control: same-purpose redemption failed");
});
