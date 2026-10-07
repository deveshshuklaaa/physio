// Layer 2: G2 (doctor approval keeps mobile), G3 (privilege leak structurally impossible). Staging only.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const H = require("./layer2_helpers");

before(() => H.setup());
after(() => H.finish());

// ---------------- G2 ----------------
test("G2 [EXPECTED-FAIL until Phase 3] doctor approval keeps mobileNumber in doctorprofiles, ciphertext on disk", async () => {
  const mobile = "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  const sup = await H.mkAdmin({ level: "SUPER_ADMIN", perms: { canManageDoctorRequests: true } });
  const f = new FormData();
  const email = H.mail();
  for (const [k, v] of Object.entries({
    fullName: "Mig Doctor", email, mobileNumber: mobile, medicalRegistrationNumber: "MIG" + Date.now(), medicalCouncil: "Test Council",
    qualification: "MBBS", specialization: "Haematology", yearsOfExperience: "5", hospitalName: "Test Hospital",
    country: "India", stateProvince: "Maharashtra", city: "Pune", declarationAccepted: "true",
  })) f.append(k, v);
  f.append("registrationCertificate", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "cert.pdf");
  f.append("professionalIdDocument", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "pid.pdf");
  const reg = await H.api("POST", "/api/doctor/register", { form: f });
  assert.strictEqual(reg.status, 201, JSON.stringify(reg.body).slice(0, 200));
  const requestId = reg.body.requestId;
  await H.tagWhere("doctorregistrationrequests", { _id: new ObjectId(requestId) });

  // Approve emails credentials; if staging SMTP fails the route deletes the doctor and 500s (see README prerequisites).
  const ap = await H.api("POST", `/api/admin/doctor-requests/${requestId}/approve`, { token: sup.token, json: {} });
  assert.strictEqual(ap.status, 200, `approve failed (staging email?): ${ap.status} ${JSON.stringify(ap.body).slice(0, 200)}`);
  const doctorId = ap.body.doctor.id;
  await H.tagUser(doctorId);

  const row = await H.db().collection("doctorprofiles").findOne({ userId: new ObjectId(doctorId) });
  assert(row, "no doctorprofiles row for the approved doctor");
  assert(H.isCiphertext(row.mobile), "doctorprofiles.mobile is not ciphertext on disk");
  const dec = await H.dec().collection("doctorprofiles").findOne({ _id: row._id });
  assert.strictEqual(dec.mobile, mobile, "mobile lost or altered at approval");
});

// ---------------- G3 ----------------
test("G3 patient signup user doc has no adminLevel / permissions (no reliance on defaults)", async () => {
  const p = await H.mkPatient();
  const doc = await H.db().collection("users").findOne({ _id: new ObjectId(p.id) });
  assert(!("adminLevel" in doc), `patient doc carries adminLevel=${doc.adminLevel}`);
  assert(!("permissions" in doc), "patient doc carries permissions");
});

test("G3 no non-admin user holds adminLevel/permissions, and none has an adminprofiles row (read-only scan)", async () => {
  const u = H.db().collection("users");
  const leaked = await u.countDocuments({ role: { $ne: "admin" }, $or: [{ adminLevel: { $exists: true } }, { permissions: { $exists: true } }] });
  // pre-Phase 3 baseline: 13 patients + 3 doctors carry adminLevel from a schema default
  assert.strictEqual(leaked, 0, `${leaked} non-admin users carry adminLevel/permissions`);
  const ids = (await u.find({ role: { $ne: "admin" } }, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
  const n = await H.db().collection("adminprofiles").countDocuments({ userId: { $in: [...ids, ...ids.map(String)] } });
  assert.strictEqual(n, 0, `${n} adminprofiles rows belong to non-admin users`);
});

// Enumerate admin routes from source, not a sample.
const routesDir = path.join(H.root, "src/routes");
const MOUNTS = { "admin.js": "/api/admin", "adminPatientResearch.js": "/api/admin/patient-research" };
function enumerate() {
  const out = [];
  for (const [file, mount] of Object.entries(MOUNTS)) {
    const src = fs.readFileSync(path.join(routesDir, file), "utf8").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
    for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g))
      out.push({ method: m[1].toUpperCase(), url: mount + m[2].replace(/:[A-Za-z]+/g, "000000000000000000000000") });
  }
  return out;
}

test("G3 every route file that uses an admin middleware is in the enumeration map", () => {
  const using = fs.readdirSync(routesDir).filter((f) => f.endsWith(".js") && /middleware\/adminAuth(Middleware)?["']/.test(
    fs.readFileSync(path.join(routesDir, f), "utf8").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n")));
  const missing = using.filter((f) => !MOUNTS[f]);
  assert.deepStrictEqual(missing, [], `admin-guarded route files not enumerated: ${missing} (add to MOUNTS)`);
});

test("G3 patient (and doctor, and anonymous) get 401/403 on every admin route, never 200", async () => {
  const routes = enumerate();
  assert(routes.length >= 15, `route enumeration found only ${routes.length}; regex broke`);
  const patient = await H.mkPatient();
  const doctorTok = jwt.sign({ userId: patient.id, role: "doctor" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const bad = [];
  for (const r of routes) {
    for (const [who, token] of [["patient", patient.token], ["doctor", doctorTok], ["anon", undefined]]) {
      const res = await H.api(r.method, r.url, { token, json: r.method === "GET" ? undefined : {} });
      if (![401, 403].includes(res.status)) bad.push(`${who} ${r.method} ${r.url} -> ${res.status}`);
    }
  }
  assert.deepStrictEqual(bad, [], bad.join("\n"));
});

test("G3 canManageAdmins: false for plain admin, true for SUPER_ADMIN (live middleware)", async () => {
  const plain = await H.mkAdmin({ level: "ADMIN", perms: { canManageAdmins: false } });
  const sup = await H.mkAdmin({ level: "SUPER_ADMIN" });
  assert.strictEqual((await H.api("GET", "/api/admin/management", { token: plain.token })).status, 403, "plain admin reached /management");
  assert.strictEqual((await H.api("GET", "/api/admin/management", { token: sup.token })).status, 200, "SUPER_ADMIN denied /management");
});

test("G3 [EXPECTED-FAIL until Phase 3] middleware reads permissions from adminprofiles, not users", async () => {
  const a = await H.mkAdmin({ level: "ADMIN", perms: { canManageAdmins: false } });
  // flip ONLY adminprofiles (our tagged fixture); users still says false
  await H.db().collection("adminprofiles").updateOne({ userId: new ObjectId(a.id), __testRun: H.RUN }, { $set: { "permissions.canManageAdmins": true } });
  assert.strictEqual((await H.api("GET", "/api/admin/management", { token: a.token })).status, 200, "adminprofiles change not honoured");
});
