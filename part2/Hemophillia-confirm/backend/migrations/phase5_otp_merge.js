// Phase 5 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend AFTER a rebuild (new model):
//   node migrations/phase5_otp_merge.js
//
// loginotps + passwordresetotps -> otpchallenges, with:
//   purpose  "login" | "password_reset"   (new; every app query filters on it)
//   userId   String -> ObjectId
//   email    cleartext -> CSFLE Deterministic
// The legacy collections are DROPPED only once every row is accounted for.
//
// OTP challenges are transient by design and swept by the TTL, so the honest migration
// is to carry over only what is still live. Expired or already-verified rows are left to
// die with the old collections: copying a dead credential forward has no value and a
// verified row is a spent one. Live rows are carried so nobody mid-login is logged out.
//
// Idempotent: a second run finds the legacy collections gone (or empty) and only
// re-asserts the end state.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext email.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
// Model registers BEFORE connect so mongoose builds the CSFLE schemaMap for the new namespace.
const OtpChallenge = require("../src/models/OtpChallenge");
const connectDB = require("../config/db");

const LEGACY = [["loginotps", "login"], ["passwordresetotps", "password_reset"]];
const isCiphertext = (v) => v?._bsontype === "Binary" && v.sub_type === 6;

(async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  const now = new Date();

  // ---------------- measure ----------------
  const plan = [];
  for (const [coll, purpose] of LEGACY) {
    if (!names.includes(coll)) { console.log(`${coll}: absent (already merged)`); continue; }
    const rows = await db.collection(coll).find({}).toArray();
    const live = rows.filter((r) => !r.verified && r.expiresAt instanceof Date && r.expiresAt > now);
    console.log(`${coll}: ${rows.length} rows, ${live.length} live (unverified + unexpired) -> purpose "${purpose}"`);
    plan.push({ coll, purpose, rows, live });
  }

  // ---------------- writes ----------------
  // Through the MODEL, so email is encrypted Deterministic and userId is cast to ObjectId.
  let carried = 0, skipped = 0;
  for (const { purpose, live } of plan) {
    for (const r of live) {
      if (await OtpChallenge.exists({ challengeId: r.challengeId })) { skipped++; continue; }
      // A legacy row whose userId is not a valid ObjectId cannot be carried: userId is now
      // a real reference. Dropping it only costs that user one re-request of their code.
      if (!mongoose.isValidObjectId(r.userId)) {
        console.warn(`  skip ${purpose} ${r.challengeId}: userId "${r.userId}" is not an ObjectId`);
        skipped++;
        continue;
      }
      await OtpChallenge.create({
        purpose,
        userId: r.userId,
        email: r.email,
        role: r.role,
        challengeId: r.challengeId,
        otpHash: r.otpHash,
        attempts: r.attempts ?? 0,
        verified: false,
        verifiedAt: r.verifiedAt ?? null,
        // userData/authPayload exist on login rows only; resetToken* on password_reset rows only.
        authPayload: r.authPayload ?? null,
        userData: r.userData ?? null,
        resetTokenHash: r.resetTokenHash ?? null,
        resetTokenExpiresAt: r.resetTokenExpiresAt ?? null,
        expiresAt: r.expiresAt,
      });
      carried++;
    }
  }
  console.log(`carried ${carried} live challenge(s), skipped ${skipped}`);

  // ---------------- post-assert BEFORE dropping anything ----------------
  const ix = await db.collection("otpchallenges").indexes();
  const ttl = ix.find((i) => i.name === "expiresAt_1");
  assert.strictEqual(ttl?.expireAfterSeconds, 0,
    "otpchallenges has no TTL on expiresAt: every expired challenge would become permanent");
  assert(ix.some((i) => i.name === "challengeId_1" && i.unique), "challengeId is not unique");

  for (const { purpose, live } of plan)
    for (const r of live)
      if (mongoose.isValidObjectId(r.userId))
        assert(await OtpChallenge.exists({ challengeId: r.challengeId, purpose }),
          `${purpose} ${r.challengeId} was not carried over`);

  // email must be ciphertext ON DISK: read with a plain client, which does not decrypt.
  const plain = await new MongoClient(process.env.MONGO_URI).connect();
  try {
    const pdb = plain.db(mongoose.connection.name);
    for await (const d of pdb.collection("otpchallenges").find()) {
      assert(isCiphertext(d.email), `otpchallenges ${d.challengeId}: email is cleartext on disk`);
      assert(["login", "password_reset"].includes(d.purpose), `otpchallenges ${d._id}: bad purpose ${d.purpose}`);
      assert(d.userId?._bsontype === "ObjectId" || d.userId instanceof require("mongodb").ObjectId,
        `otpchallenges ${d.challengeId}: userId is not an ObjectId`);
    }
  } finally { await plain.close(); }

  // ---------------- drop the legacy collections ----------------
  for (const { coll } of plan) {
    await db.collection(coll).drop();
    console.log(`dropped ${coll}`);
  }

  const after = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  for (const [coll] of LEGACY) assert(!after.includes(coll), `${coll} still exists`);

  console.log("PHASE 5 OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
