/**
 * Reset one staff account's password. Password from env, never hardcoded (D24).
 *   DOC_PROF_ID=DOC002 NEW_PASSWORD='...' node scripts/resetStaffPassword.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../src/models/User");
const { displayName, splitName } = require("../src/utils/displayName");

(async () => {
  const profId = process.env.DOC_PROF_ID;
  const newPw = process.env.NEW_PASSWORD;
  if (!profId || !newPw) {
    console.error("Need DOC_PROF_ID and NEW_PASSWORD in env.");
    process.exit(2);
  }
  await connectDB();
  const u = await User.findOne({ professionalId: profId });
  if (!u) { console.error("No account for", profId); process.exitCode = 1; return; }
  u.passwordHash = await bcrypt.hash(newPw, 10);
  u.mustChangePassword = false;   // don't force a change mid-demo
  await u.save();
  console.log(`Reset OK: ${profId} (${displayName(u)}). New password NOT printed.`);
})().catch(e => { console.error("FAILED:", e.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState === 1) await mongoose.connection.close(); });
