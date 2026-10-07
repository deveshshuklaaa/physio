// Layer 2 helpers: live STAGING app (:5001) + STAGING db (hemophilia_stage). Never production.
// Intentionally duplicates ideas from helpers.js (Layer 1 owns that file; do not import it).
//
//   BASE / STAGE_DB          targets. assertTargets() fails closed if either is wrong.
//   RUN                      "<iso>-<pid>" __testRun tag carried by every fixture.
//   isCiphertext(v)          Binary sub_type 6, nothing else.
//   policy                   config/otpPolicy constants (never hardcode 185/180).
//   setup()                  guard -> connect -> preflight -> baseline counts. Call in before().
//   finish()                 tag-sweep, delete by tag, assert zero left + counts == baseline. Call in after().
//   dec()                    encrypted-connection db; decrypts reads (plaintext comparison only)
//   db()                     PLAIN MongoClient db (no autoEncryption): reads show true on-disk bytes.
//   api(method, path, opts)  fetch against BASE. opts: {token, json, form, headers}
//   mkPatient / mkAdmin      fixtures (patient via real HTTP signup; admin seeded through encrypted model)
//   tagUser / tagWhere       adopt a doc the APP created so teardown can delete it by tag
//   setPerm(adminId,p,v)     flip a permission in users AND adminprofiles (Phase 3 contract)
//   seedChallenge(purpose,o) raw tagged OTP challenge with a known OTP (legacy collections, or otpchallenges once it exists)
//   snapshot()/diffCounts()  per-collection counts, for "nothing was written" assertions
const assert = require("assert");
const path = require("path");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const root = path.join(__dirname, "..", "..");
const STAGE_DB = "hemophilia_stage";
const BASE = (process.env.L2_BASE_URL || "http://localhost:5001").replace(/\/$/, "");
const RUN = `${new Date().toISOString()}-${process.pid}`;
const policy = require(path.join(root, "config/otpPolicy"));

// ---- CSFLE gate: seeding admins writes encrypted email; refuse to write cleartext PHI-ish data.
const { cryptSharedAvailable, cryptSharedLibPath } = require(path.join(root, "config/cryptSharedPath"));
if (!cryptSharedAvailable) { console.error("ABORT: crypt_shared missing."); process.exit(1); }

const isCiphertext = (v) => v?._bsontype === "Binary" && v.sub_type === 6;

// ---- The hard guards. First lines of setup(); also re-checked before every write helper.
function stageUri() {
  const u = process.env.MONGO_URI;
  assert(u && /\/hemophilia(\?|$)/.test(u), "ABORT: MONGO_URI missing or has no /hemophilia path segment");
  return u.replace(/\/hemophilia(\?|$)/, `/${STAGE_DB}$1`);
}
function assertTargets() {
  assert(BASE.includes(":5001"), `ABORT: base URL "${BASE}" does not contain :5001 (port 80 is production)`);
  assert(!/:80(\/|$)/.test(BASE), "ABORT: base URL points at :80");
}
let client, mongoose, _db;
function db() {
  assert(_db, "setup() not called");
  assert.strictEqual(_db.databaseName, STAGE_DB, `ABORT: connected to "${_db.databaseName}", not ${STAGE_DB}`);
  return _db;
}

// ---- HTTP
async function api(method, p, { token, json, form, headers = {} } = {}) {
  assertTargets();
  const h = { ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  let body;
  if (form) body = form;
  else if (json !== undefined) { h["content-type"] = "application/json"; body = JSON.stringify(json); }
  const res = await fetch(BASE + p, { method, headers: h, body, signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, body: data };
}

// ---- tagging. Only ever touches docs we created, or adopted by exact id we created via the app.
const ownedUsers = new Set();
const USER_REFS = [["users", "_id"], ["patientprofiles", "userId"], ["hemophiliadetails", "userId"], ["assessments", "userId"],
  ["doctorchangerequests", "patientUserId"], ["adminprofiles", "userId"], ["doctorprofiles", "userId"],
  ["loginotps", "userId"], ["passwordresetotps", "userId"], ["otpchallenges", "userId"], ["physiosessions", "patientUserId"]];

async function tagWhere(coll, filter) {
  assert(filter && Object.keys(filter).length, "refusing to tag with an empty filter");
  await db().collection(coll).updateMany(filter, { $set: { __testRun: RUN } });
}
async function tagUser(id) {
  id = String(id);
  ownedUsers.add(id);
  const ids = [new ObjectId(id), id];
  for (const [c, f] of USER_REFS) await tagWhere(c, { [f]: { $in: ids } });
}

// ---- lifecycle
async function collNames() {
  return (await db().listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).filter((n) => !n.startsWith("system."));
}
async function snapshot() {
  const out = {};
  for (const n of await collNames()) out[n] = await db().collection(n).countDocuments();
  return out;
}
function diffCounts(a, b) {
  const d = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if ((a[k] || 0) !== (b[k] || 0)) d[k] = `${a[k] || 0} -> ${b[k] || 0}`;
  return d;
}
let baseline, encMongoose;
async function setup() {
  assertTargets();
  client = await new MongoClient(stageUri()).connect(); // plain: no autoEncryption, reads stay ciphertext
  _db = client.db(STAGE_DB);
  db(); // asserts name BEFORE anything else
  // Preflight: stale tagged docs mean a previous run leaked, or tags collide. Refuse.
  for (const n of await collNames()) {
    const hit = await db().collection(n).findOne({ __testRun: { $exists: true } }, { projection: { _id: 1 } });
    assert(!hit, `PREFLIGHT: ${n} already holds a doc with __testRun. Refusing to run.`);
  }
  baseline = await snapshot();
  // Encrypted connection ONLY for seeding admins (email is Deterministic CSFLE). Same DEK as prod; no extra handling.
  mongoose = require("mongoose");
  for (const m of ["User", "PatientProfile", "HemophiliaDetails", "Assessment", "DoctorRegistrationRequest", "DoctorChangeRequest", "LoginOTP", "PasswordResetOTP"])
    require(path.join(root, "src/models", m));
  await mongoose.connect(stageUri(), {
    dbName: STAGE_DB,
    autoEncryption: {
      keyVaultNamespace: "encryption.__keyVault",
      kmsProviders: { local: { key: require(path.join(root, "config/masterKey")).localMasterKey } },
      extraOptions: { cryptSharedLibPath },
    },
  });
  assert.strictEqual(mongoose.connection.name, STAGE_DB, `ABORT: mongoose on "${mongoose.connection.name}"`);
  encMongoose = mongoose;
  assert(process.env.JWT_SECRET, "JWT_SECRET must be set to the SAME value the staging app uses");
  await assertAppOnStaging();
}

// Prove the APP is pointed at hemophilia_stage BEFORE any route writes anything.
//
// The DB guards above only prove OUR client is on staging. The app reads its own
// MONGO_URI independently, so a misconfigured staging app could be talking to
// production while every assertion here looks clean. Creating the first fixture
// through POST /api/auth/register would then write a user into the production PHI
// database, and the old canary only noticed afterwards -- too late.
//
// So: seed a user DIRECTLY into staging (never through the app), then ask the app
// to log in as it. routes/auth.js:122 answers 401 and writes NOTHING when the
// email is not found, so an app on production fails this check having written
// nothing anywhere.
async function assertAppOnStaging() {
  const email = mail(), password = pw();
  const User = encMongoose.model("User");
  const seeded = await User.create({
    fullName: "Mig Canary",
    email,
    passwordHash: await require("bcryptjs").hash(password, 10),
    role: "patient",
    accountStatus: "APPROVED",
    __testRun: RUN,
  });
  ownedUsers.add(String(seeded._id));

  const r = await api("POST", "/api/auth/login", { json: { email, password } });
  assert.notStrictEqual(
    r.status, 401,
    `ABORT: the staging app does not know a user that exists in ${STAGE_DB}. ` +
    "It is NOT pointed at staging -- check MONGO_URI_STAGE. No route write was attempted."
  );
  // A successful login mints an OTP challenge the app did not tag. Drop it so the
  // teardown count-delta check stays meaningful.
  for (const c of ["loginotps", "otpchallenges"]) {
    await db().collection(c).deleteMany({ userId: { $in: [seeded._id, String(seeded._id)] } }).catch(() => {});
  }
}
// Always call from after(): runs even when a test threw.
async function finish() {
  if (!_db) return;
  const errs = [];
  try {
    for (const id of ownedUsers) await tagUser(id); // sweep derived docs (profiles, otps...) of OUR fixtures
    for (const n of await collNames()) await db().collection(n).deleteMany({ __testRun: RUN });
    for (const n of await collNames()) {
      const left = await db().collection(n).countDocuments({ __testRun: RUN });
      if (left) errs.push(`${n}: ${left} tagged docs remain`);
    }
    const d = diffCounts(baseline, await snapshot());
    if (Object.keys(d).length) errs.push(`count delta vs baseline (orphans from untagged writes, or concurrent staging traffic): ${JSON.stringify(d)}`);
  } catch (e) { errs.push(String(e.stack || e)); }
  await encMongoose?.disconnect().catch(() => {});
  await client?.close().catch(() => {});
  _db = undefined;
  assert.strictEqual(errs.length, 0, "TEARDOWN: " + errs.join("; "));
}

// ---- fixtures
const uid = () => crypto.randomUUID();
const mail = () => `migtest+${uid()}@example.invalid`;
const pw = () => `Mig!Test9-${uid()}`;

// Real signup route. Canary: the user must land in hemophilia_stage, else the app is not wired to staging -> abort.
async function mkPatient() {
  const email = mail(), password = pw();
  const r = await api("POST", "/api/auth/register", { json: { fullName: "Mig Test", email, password } });
  assert.strictEqual(r.status, 201, `fixture signup failed: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const id = r.body.user.id;
  await tagUser(id);
  const doc = await db().collection("users").findOne({ _id: new ObjectId(id) });
  assert(doc, "ABORT: app-created user is not in hemophilia_stage. App is NOT pointed at staging.");
  return { id, email, password, token: r.body.token, role: "patient" };
}
const profileBody = () => ({
  fullName: "Mig Test", gender: "Male", dob: "1990-01-01", bloodGroup: "O+", mobile: "9876543210", state: "Maharashtra",
  city: "Pune", pinCode: "411001", emergencyName: "Mig Contact", emergencyRelationship: "Sibling", emergencyPhone: "9876543211",
  address: "1 Test Lane", hospitalName: "Test Hospital",
});
async function mkProfile(p) {
  const r = await api("POST", "/api/profile/patient-profile", { token: p.token, json: profileBody() });
  assert(r.status >= 200 && r.status < 300, `fixture profile failed: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  await tagUser(p.id);
}
// Seeded through the real model so email is CSFLE ciphertext; adminLevel/permissions are written to users (pre-Phase 3 contract)
// AND adminprofiles (Phase 3 contract). Phase 3 strict schema drops the users copy; that is fine.
async function mkAdmin({ level = "ADMIN", perms = {} } = {}) {
  const User = encMongoose.model("User");
  const email = mail(), password = pw();
  const permissions = { canManageAdmins: false, canManageDoctors: false, canViewPatients: false, canManageDoctorRequests: false, ...perms };
  const u = await User.create({ fullName: "Mig Admin", email, passwordHash: await bcrypt.hash(password, 4), role: "admin", accountStatus: "APPROVED", adminLevel: level, permissions });
  const id = String(u._id);
  await tagUser(id);
  await db().collection("adminprofiles").insertOne({ userId: u._id, adminLevel: level, permissions, __testRun: RUN });
  return { id, email, password, level, token: jwt.sign({ userId: id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" }), role: "admin" };
}
async function setPerm(adminId, perm, val) {
  const _id = new ObjectId(adminId);
  const own = await db().collection("users").findOne({ _id, __testRun: RUN }, { projection: { _id: 1 } });
  assert(own, "setPerm refused: not a tagged fixture");
  await db().collection("users").updateOne({ _id, __testRun: RUN }, { $set: { [`permissions.${perm}`]: val } });
  await db().collection("adminprofiles").updateOne({ userId: _id, __testRun: RUN }, { $set: { [`permissions.${perm}`]: val } });
}

// Which collection holds challenges now? otpchallenges once Phase 5 lands, else the legacy pair.
async function otpTarget(purpose) {
  const merged = (await collNames()).includes("otpchallenges");
  return merged ? { name: "otpchallenges", extra: { purpose } } : { name: purpose === "login" ? "loginotps" : "passwordresetotps", extra: {} };
}
async function seedChallenge(purpose, { userId, role = "patient", otp = "123456", attempts = 0, expiresAt, email = mail() }) {
  const t = await otpTarget(purpose);
  const challengeId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const doc = {
    userId: t.name === "otpchallenges" ? new ObjectId(String(userId)) : String(userId),
    email, role, challengeId, otpHash: await bcrypt.hash(otp, 4), attempts, verified: false,
    expiresAt: expiresAt || new Date(Date.now() + policy.OTP_EXPIRY_SECONDS * 1000), createdAt: now, updatedAt: now,
    ...t.extra, __testRun: RUN,
  };
  if (purpose === "login") { doc.authPayload = { userId: String(userId), role }; doc.userData = { id: String(userId), email, role, mustChangePassword: false }; }
  await db().collection(t.name).insertOne(doc);
  return { challengeId, otp, coll: t.name };
}

// Encrypted-connection db: auto-DECRYPTS reads of ciphertext (decrypt needs no schema). Use only to compare plaintext.
const dec = () => encMongoose.connection.db;

module.exports = { dec, BASE, STAGE_DB, RUN, policy, isCiphertext, assertTargets, assertAppOnStaging, db, api, setup, finish, mkPatient, mkProfile, mkAdmin, setPerm,
  profileBody, tagUser, tagWhere, seedChallenge, otpTarget, collNames, snapshot, diffCounts, uid, mail, root };
