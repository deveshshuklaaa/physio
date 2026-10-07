// Layer 1: G12 — the CSFLE abort gate. Real config/cryptSharedPath.js is untouched; crypt_shared is made
// "unavailable" via CRYPT_SHARED_LIB_PATH=/nonexistent (the module's documented override), so the real
// module computes cryptSharedAvailable=false. The probe script is the plan's gate + one write.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { raw, testUri, prodCounts, teardown } = require("./helpers");

const cfg = path.join(__dirname, "..", "..", "config", "cryptSharedPath");
const probe = path.join(__dirname, "_gate_probe.js");
let client, db, prodBefore;

before(async () => {
  prodBefore = await prodCounts();
  ({ client, db } = await raw());
  fs.writeFileSync(probe, `
    const { cryptSharedAvailable } = require(${JSON.stringify(cfg)});
    if (!cryptSharedAvailable) { console.error("ABORT: crypt_shared missing — would write cleartext PHI."); process.exit(1); }
    const { MongoClient } = require("mongodb");
    (async () => {
      const c = await new MongoClient(process.env.TEST_URI).connect();
      if (c.db("hemophilia_test").databaseName !== "hemophilia_test") process.exit(3);
      await c.db("hemophilia_test").collection("gateprobe").insertOne({ x: 1 });
      await c.close();
    })();`);
});
after(async () => {
  fs.rmSync(probe, { force: true });
  await teardown(client);
  assert.deepStrictEqual(await prodCounts(), prodBefore, "hemophilia counts changed");
});

const run = (lib) => spawnSync("node", [probe], { encoding: "utf8", env: { ...process.env, CRYPT_SHARED_LIB_PATH: lib, TEST_URI: testUri } });

test("G12 control: with crypt_shared present the probe passes the gate and writes exactly 1 doc", async () => {
  const r = run(process.env.CRYPT_SHARED_LIB_PATH);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(await db.collection("gateprobe").countDocuments(), 1);
  await db.collection("gateprobe").deleteMany({});
});

test("G12 crypt_shared unavailable -> exit code 1, ABORT message, zero documents written", async () => {
  const r = run("/nonexistent/mongo_crypt_v1.so");
  assert.strictEqual(r.status, 1, `exit ${r.status}: ${r.stderr}`);
  assert.match(r.stderr, /ABORT: crypt_shared missing/);
  assert.strictEqual(await db.collection("gateprobe").countDocuments(), 0, "gate let a write through");
});
