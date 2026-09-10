const FHIRResource = require("../models/FHIRResource");

/**
 * Stores ONE complete FHIR Bundle per patient.
 *
 * MongoDB document:
 *
 * {
 *   resourceType: "Bundle",      // plaintext
 *   id: "PAT111618",              // plaintext
 *   encryptedData: {              // CSFLE encrypted
 *     type,
 *     timestamp,
 *     total,
 *     entry: [...]
 *   }
 * }
 */

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

    // ============================================
    // Keep ONLY these two fields outside encryption
    // ============================================

    const {
        resourceType,
        id,
        ...encryptedData
    } = bundle;

    // ============================================
    // Save / update ONE document per patient
    // ============================================

    const saved = await FHIRResource.findOneAndUpdate(
        {
            resourceType: "Bundle",
            id: id,
        },
        {
            $set: {
                resourceType: resourceType,
                id: id,
                encryptedData: encryptedData,
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