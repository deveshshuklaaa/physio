const mongoose = require("mongoose");

const fhirResourceSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      required: true,
      index: true,
    },

    id: {
      type: String,
      required: true,
      index: true,
    },

    encryptedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports =
  mongoose.models.FHIRResource ||
  mongoose.model("FHIRResource", fhirResourceSchema);