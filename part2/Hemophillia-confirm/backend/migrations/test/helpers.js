// Shared by Layer 1 (and Layer 2) migration tests. Exports (stable):
//   gate()                  CSFLE abort gate: exit(1) unless crypt_shared is present. Call first.
//   isCiphertext(v)         v?._bsontype==="Binary" && v.sub_type===6. Nothing else counts.
//   testUri                 MONGO_URI with the /hemophilia path segment rewritten to /hemophilia_test.
//   TEST_DB                 "hemophilia_test"
//   connectEncrypted()      -> mongoose, connected to TEST_DB with CSFLE on, all models registered.
//                           Asserts the connected db name BEFORE returning (guard).
//   raw()                   -> { client, db } PLAIN MongoClient on TEST_DB (no autoEncryption at all).
//                           Reads show true on-disk bytes. A client with NO autoEncryption
//                           config cannot decrypt -- verified: users.email comes back as
//                           Binary sub_type=6. bypassAutoEncryption:true is not used because
//                           it is only valid INSIDE an autoEncryption block (which needs the
//                           keyVaultNamespace and KMS providers); it suppresses auto-encryption
//                           on WRITES and leaves decryption on reads enabled, which is the
//                           opposite of what these assertions need.
//   prodCounts()            read-only per-collection counts of `hemophilia` (before/after check).
//   readProdOne(coll, filter) READ-ONLY raw findOne on `hemophilia` (plain client; ciphertext stays ciphertext).
//   teardown(...closeables) drops TEST_DB (guarded) and closes mongoose + raw clients.
//   guardDb(name)           throws unless name === TEST_DB.
// Run inside hemo-backend: node --test /app/migrations/test/<file>
const assert = require("assert");
const path = require("path");
const { MongoClient } = require("mongodb");

const TEST_DB = "hemophilia_test";
const root = path.join(__dirname, "..", "..");

function gate() {
  const { cryptSharedAvailable } = require(path.join(root, "config/cryptSharedPath"));
  if (!cryptSharedAvailable) {
    console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
    process.exit(1);
  }
}
gate(); // every script that requires helpers is gated, before any connection exists

const isCiphertext = (v) => v?._bsontype === "Binary" && v.sub_type === 6;

const uriOf = (db) => {
  assert(/\/hemophilia(\?|$)/.test(process.env.MONGO_URI), "MONGO_URI has no /hemophilia path");
  return process.env.MONGO_URI.replace(/\/hemophilia(\?|$)/, `/${db}$1`);
};
const testUri = uriOf(TEST_DB);

function guardDb(name) {
  assert.strictEqual(name, TEST_DB, `ABORT: connected to "${name}", not ${TEST_DB}`);
}

function masterKey() {
  // Env only, via config/masterKey. No file fallback: a fallback to
  // master-key.txt keeps the repo key file load-bearing, which is the thing
  // moving the key into CSFLE_MASTER_KEY was meant to end. It also fails open --
  // a missing env var would silently read a stale key instead of stopping.
  return require(path.join(root, "config/masterKey")).localMasterKey;
}

// Registered BEFORE mongoose.connect() so CSFLE builds a schemaMap for each. A model
// registered after connect gets no schemaMap entry, so its "encrypted" fields are
// written in CLEARTEXT while the suite still reports green. Add every new model here.
// ClinicalRecord joins this list at Phase 7.
const models = ["User", "PatientProfile", "HemophiliaDetails", "Assessment", "DoctorRegistrationRequest",
  "DoctorChangeRequest", "PatientExerciseRecommendation", "LoginOTP", "PasswordResetOTP", "FHIRResource",
  "AdminProfile", "DoctorProfile"];

async function connectEncrypted() {
  const mongoose = require("mongoose");
  // A model file that does not exist yet (its phase has not shipped, or the image
  // predates it) is skipped loudly. Anything else rethrows: a model that EXISTS but
  // fails to register would get no schemaMap entry and write cleartext.
  for (const m of models) {
    try {
      require(path.join(root, "src/models", m));
    } catch (e) {
      if (e.code === "MODULE_NOT_FOUND" && String(e.message).includes(m)) {
        console.warn(`helpers: model ${m} not present, skipping (its phase has not shipped here)`);
        continue;
      }
      throw e;
    }
  }
  const { cryptSharedLibPath } = require(path.join(root, "config/cryptSharedPath"));
  await mongoose.connect(testUri, {
    dbName: TEST_DB,
    autoEncryption: {
      keyVaultNamespace: "encryption.__keyVault",
      kmsProviders: { local: { key: masterKey() } },
      extraOptions: { cryptSharedLibPath },
    },
  });
  guardDb(mongoose.connection.name);
  return mongoose;
}

async function raw() {
  const client = await new MongoClient(testUri).connect();
  const db = client.db(TEST_DB);
  guardDb(db.databaseName);
  return { client, db };
}

async function prodCounts() {
  const client = await new MongoClient(uriOf("hemophilia")).connect();
  try {
    const db = client.db("hemophilia");
    const out = {};
    for (const c of await db.listCollections({}, { nameOnly: true }).toArray()) out[c.name] = await db.collection(c.name).countDocuments();
    return out;
  } finally { await client.close(); }
}

async function readProdOne(coll, filter = {}) {
  const client = await new MongoClient(uriOf("hemophilia")).connect();
  try { return await client.db("hemophilia").collection(coll).findOne(filter); } finally { await client.close(); }
}

async function teardown(...closeables) {
  const { client, db } = await raw();
  await db.dropDatabase();
  await client.close();
  for (const c of closeables) await c?.close?.() ?? c?.disconnect?.();
}

module.exports = { gate, isCiphertext, testUri, TEST_DB, connectEncrypted, raw, prodCounts, readProdOne, teardown, guardDb };
