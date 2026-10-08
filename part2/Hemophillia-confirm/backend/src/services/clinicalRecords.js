const ClinicalRecord = require("../models/ClinicalRecord");

const latest = (userId) =>
  ClinicalRecord.findOne({ userId }).sort({ version: -1 }).limit(1);

// First submission AND edit. Duplicate-key (E11000) from a concurrent append is
// deliberately NOT caught: callers map it to 409. create() runs BEFORE the
// predecessor is touched, so a rejected append burns nothing and edits nothing.
async function append(userId, data, recordedBy) {
  const prev = await latest(userId);
  const rec = await ClinicalRecord.create({
    ...data,
    userId,
    version: (prev?.version ?? 0) + 1,
    recordedAt: new Date(),
    recordedBy,
    supersededBy: null,
  });
  // ponytail: crash between these two leaves prev.supersededBy null; latest() still
  // correct (sorts by version), only supersededBy:null readers would see two.
  if (prev)
    await ClinicalRecord.updateOne({ _id: prev._id }, { supersededBy: rec._id }, { timestamps: false });
  return rec;
}

module.exports = { latest, append };
