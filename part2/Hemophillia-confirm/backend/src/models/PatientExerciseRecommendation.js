const mongoose = require("mongoose");

const patientExerciseRecommendationSchema = new mongoose.Schema(
  {
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true },
    exerciseName: { type: String, required: true },
    type: {
      type: String,
      enum: ["GENERAL", "JOINT"],
      required: true,
    },
    joint: { type: String, default: null },
    category: { type: String, required: true },
    source: {
      type: String,
      // G2-C6: "RULE" is the new deterministic source. "ML" and
      // "RULE_FALLBACK" are kept -- not retired -- because existing rows
      // still carry them; retire only after those rows are migrated.
        // Future comment : above comment has been done, fallback will be removed
      enum: ["ML", "DOCTOR", "RULE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING_DOCTOR_REVIEW", "ACTIVE", "REMOVED"],
      default: "PENDING_DOCTOR_REVIEW",
      index: true,
    },
    sets: { type: Number, default: 1 },
    repetitionsOrDuration: { type: String, default: "10" },
    frequency: { type: String, default: "as advised" },
    schedule: { type: String, default: null },
    purpose: { type: String, default: "" },
    mlConfidence: { type: Number, default: null },
    recommendationReason: { type: String, default: "" },
    recommendedAt: { type: Date, default: Date.now },
    doctorReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    doctorReviewedAt: { type: Date, default: null },
    doctorNote: { type: String, default: "" },
    doctorRemoved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

patientExerciseRecommendationSchema.index(
  { patientUserId: 1, exerciseId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PatientExerciseRecommendation ||
  mongoose.model(
    "PatientExerciseRecommendation",
    patientExerciseRecommendationSchema
  );
