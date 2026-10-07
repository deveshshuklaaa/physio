// One-off repair for the first Phase 4 run: nameTranslations was written per-language,
// so unchanged values stayed CLEARTEXT while changed ones were encrypted. The hook now
// calls markModified(), but existing rows need a forced rewrite.
//
// Re-saves every user through the encrypted client so all three languages are written,
// and therefore encrypted. Idempotent: re-running just rewrites the same values.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing -- would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const connectDB = require("../config/db");
const User = require("../src/models/User");

// Rows that fail schema validation for pre-existing reasons (see phase4_name_split.js).
const LEGACY_INVALID_IDS = new Set([
  "6aa190e7434d07476b7f4114", "6aa196c88d097a3a7574516d",
  "6aa2cc1eb80bb37a4f10ed86", "6ab97a6c26c262d4ede9dbee",
  "6aa176bdbb076d281b03f7b7",
]);

const isCT = (v) => v && v._bsontype === "Binary" && v.sub_type === 6;

(async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const plain = await new MongoClient(process.env.MONGO_URI).connect();
  try {
    const raw = plain.db(db.databaseName).collection("users");
    const before = (await raw.find({}, { projection: { nameTranslations: 1 } }).toArray())
      .filter((u) => ["en", "hi", "mr"].some((l) => u.nameTranslations && u.nameTranslations[l] !== undefined && !isCT(u.nameTranslations[l]))).length;
    console.log(`users with cleartext nameTranslations: ${before}`);

    for (const u of await User.find({})) {
      // The pre-save hook returns early unless a name part is modified (User.js:365),
      // so a plain re-save is a no-op and leaves the cleartext values in place.
      // Mark a name path dirty to make the hook run and rewrite all three languages.
      u.markModified("firstName");
      try {
        await u.save(); // hook recomputes + markModified -> all 3 languages written
      } catch (e) {
        if (e.name !== "ValidationError" || !LEGACY_INVALID_IDS.has(String(u._id))) throw e;
        await u.save({ validateBeforeSave: false });
      }
    }

    for (const u of await raw.find({}, { projection: { nameTranslations: 1 } }).toArray())
      for (const l of ["en", "hi", "mr"])
        if (u.nameTranslations && u.nameTranslations[l] !== undefined)
          assert(isCT(u.nameTranslations[l]), `users ${u._id}: nameTranslations.${l} still cleartext`);

    console.log("NAMETRANSLATIONS REPAIR OK");
  } finally {
    await plain.close();
  }
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
