    // =======================================================
    // medicationMapper.js
    // FHIR R4 MedicationStatement Mapper
    // =======================================================

    const toFHIRMedicationStatement = (details) => {
    if (!details) return [];

    const medications = [];

    // ============================================
    // Current Factor Therapy
    // ============================================

    if (details.currentFactorTherapy) {
        medications.push({
        resourceType: "MedicationStatement",

        id: `${details._id}-factor-therapy`,

        meta: {
            profile: [
            "http://hl7.org/fhir/StructureDefinition/MedicationStatement",
            ],
            lastUpdated: details.updatedAt
            ? details.updatedAt.toISOString()
            : undefined,
        },

        status: "active",

        subject: {
            reference: `Patient/${details.patientId}`,
        },

        effectiveDateTime: details.updatedAt
            ? details.updatedAt.toISOString()
            : undefined,

        medicationCodeableConcept: {

            // TODO:
            // Replace with verified RxNorm/SNOMED code if available

            text: details.currentFactorTherapy,
        },

        note: [
            {
            text: "Current factor replacement therapy reported by patient.",
            },
        ],
        });
    }

    // ============================================
    // Other Medications
    // ============================================

    if (details.otherMedications) {
        medications.push({
        resourceType: "MedicationStatement",

        id: `${details._id}-other-medication`,

        meta: {
            profile: [
            "http://hl7.org/fhir/StructureDefinition/MedicationStatement",
            ],
            lastUpdated: details.updatedAt
            ? details.updatedAt.toISOString()
            : undefined,
        },

        status: "active",

        subject: {
            reference: `Patient/${details.patientId}`,
        },

        effectiveDateTime: details.updatedAt
            ? details.updatedAt.toISOString()
            : undefined,

        medicationCodeableConcept: {

            // TODO:
            // Replace with verified RxNorm code

            text: details.otherMedications,
        },

        note: [
            {
            text: "Additional medications currently taken by the patient.",
            },
        ],
        });
    }

    return medications;
    };

    module.exports = {
    toFHIRMedicationStatement,
    };