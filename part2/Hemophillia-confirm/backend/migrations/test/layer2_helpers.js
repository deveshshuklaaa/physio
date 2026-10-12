// Layer 2 helpers: a live NON-PRODUCTION app + a non-production db. Never production.
//
// RETARGETED 2026-10-12 (APP-B, docs/19 §13 item 49). Was hardwired to the abandoned staging
// pair (app :5001 + db hemophilia_stage), which made the suite ABORT in the APP-0.1 VPS test
// env, whose MONGO_URI ends /hemophilia_test. The guard is not weakened -- it is inverted:
// it used to assert "I am on staging", it now asserts "I am NOT on production". Same
// fail-closed property, satisfiable by any test target. Override with L2_DB / L2_BASE_URL.
// Intentionally duplicates ideas from helpers.js (Layer 1 owns that file; do not import it).
//
//   BASE / STAGE_DB          targets. assertTargets() fails closed if either looks like production.
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
const PROD_DB = "hemophilia";              // the one name that is never a legal target
const TARGET_RE = /_(test|stage)$/;         // a test db must say so in its own name
// db name from MONGO_URI's own path, NOT derived by rewriting it: deriving is how a prod URI
// silently became a legal target. L2_DB overrides for an oddly-named clone.
//
// FIXED 2026-10-12 (APP-B, test-security-agent; found by layer2_guard_matrix.test.js). The old
// /\/([^/?]+)(\?|$)/ matched the AUTHORITY of a path-less URI, so "mongodb://127.0.0.1:27017"
// and "mongodb+srv://cluster.mongodb.net" resolved a "db name" of "127.0.0.1:27017" /
// "cluster.mongodb.net". Still fail-closed -- they were refused -- but by the *_test/*_stage rule,
// so the abort named the wrong guard and the "cannot determine" branch was unreachable except on
// an empty MONGO_URI. Now: scheme off, authority off, path only. No path -> "" -> "cannot
// determine the target db name". Every abort below is unchanged; the barrier is not one
// millimetre looser.
function dbNameFromUri(u) {
  const s = String(u || "").replace(/^[a-z][a-z0-9+.-]*:\/\//i, ""); // drop scheme
  const slash = s.indexOf("/");                                       // first / ends the authority
  if (slash < 0) return "";                                           // no path component at all
  return s.slice(slash + 1).split("?")[0];                            // path, minus any query
}
const STAGE_DB = process.env.L2_DB || dbNameFromUri(process.env.MONGO_URI);
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
  assert(u, "ABORT: MONGO_URI is not set");
  assertTargets();
  return u;   // used as-is. the db name is asserted, never rewritten.
}
// Called in setup() AND before every write helper AND on every api() call.
function assertTargets() {
  // --- database: the only barrier between this suite and production patient data.
  assert(STAGE_DB, "ABORT: cannot determine the target db name from MONGO_URI (set L2_DB)");
  assert(STAGE_DB !== PROD_DB, `ABORT: target db is "${PROD_DB}" -- that is PRODUCTION`);
  assert(TARGET_RE.test(STAGE_DB),
    `ABORT: target db "${STAGE_DB}" is not named *_test or *_stage. Refusing to write to a db ` +
    `that does not declare itself non-production. Override deliberately with L2_DB.`);
  // --- app: production is nginx on 80/443. A test target is anything else on loopback.
  assert(!/:(80|443)(\/|$)/.test(BASE), `ABORT: base URL "${BASE}" points at a production port`);
  assert(/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE),
    `ABORT: base URL "${BASE}" is not loopback. This suite never drives a remote host.`);
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

  // fhirresources has no userId -- it keys on `id` = the PAT###### business key. The
  // app writes a Patient resource whenever a profile is created, so without this
  // those docs stay untagged, nothing sweeps them, and the teardown count-delta
  // assertion trips on every file that creates a profile.
  const pids = (await db().collection("patientprofiles")
    .find({ userId: { $in: ids } }, { projection: { patientId: 1 } }).toArray())
    .map((d) => d.patientId).filter(Boolean);
  if (pids.length) await tagWhere("fhirresources", { id: { $in: pids } });
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
  for (const m of ["User", "PatientProfile", "HemophiliaDetails", "Assessment", "DoctorRegistrationRequest", "DoctorChangeRequest", "OtpChallenge"])
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

// Prove the APP is pointed at the target db BEFORE any route writes anything.
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
    firstName: "Mig",
    lastName: "Canary",
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
    `ABORT: the app under test does not know a user that exists in ${STAGE_DB}. ` +
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

// Real signup route. Canary: the user must land in STAGE_DB, else the app is wired elsewhere -> abort.
async function mkPatient() {
  const email = mail(), password = pw();
  const r = await api("POST", "/api/auth/register", { json: { firstName: "Mig", middleName: "", lastName: "Test", email, password } });
  assert.strictEqual(r.status, 201, `fixture signup failed: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const id = r.body.user.id;
  await tagUser(id);
  const doc = await db().collection("users").findOne({ _id: new ObjectId(id) });
  assert(doc, `ABORT: app-created user is not in ${STAGE_DB}. The app is NOT pointed at the target db.`);
  return { id, email, password, token: r.body.token, role: "patient" };
}
const profileBody = () => ({
  firstName: "Mig", middleName: "", lastName: "Test", gender: "Male", dob: "1990-01-01", bloodGroup: "O+", mobile: "9876543210", state: "Maharashtra",
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
  const u = await User.create({ firstName: "Mig", lastName: "Admin", email, passwordHash: await bcrypt.hash(password, 4), role: "admin", accountStatus: "APPROVED", adminLevel: level, permissions });
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
