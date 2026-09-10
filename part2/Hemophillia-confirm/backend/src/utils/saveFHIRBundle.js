const FHIRResource = require("../models/FHIRResource");

const saveFHIRBundle = async (bundle) => {
  if (!bundle) {
    throw new Error("FHIR Bundle is required");
  }

  if (bundle.resourceType !== "Bundle") {
    throw new Error("Expected FHIR Bundle");
  }

  if (!bundle.id) {
    throw new Error("FHIR Bundle must have an id");
  }

  const {
    resourceType,
    id,
    ...encryptedData
  } = bundle;

  const saved =
    await FHIRResource.findOneAndUpdate(
      {
        resourceType: "Bundle",
        id: id,
      },
      {
        $set: {
          resourceType,
          id,
          encryptedData,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

  console.log("=================================");
  console.log("✅ FHIR Bundle saved");
  console.log("Patient:", id);
  console.log("Resource:", resourceType);
  console.log("=================================");

  return saved;
};

module.exports = saveFHIRBundle;