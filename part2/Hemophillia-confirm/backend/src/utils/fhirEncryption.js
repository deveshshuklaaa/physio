// =====================================================
// FHIR ENCRYPTION
// =====================================================
//
// FHIR data encryption is handled automatically by
// MongoDB CSFLE through the schemaMap configured in:
//
//     config/db.js
//
// Therefore, DO NOT manually encrypt the FHIR data here.
// =====================================================

async function encryptFHIRData(data) {
    if (!data) {
        throw new Error("FHIR data is required");
    }

    // CSFLE automatically encrypts the field
    // when the FHIRResource document is saved.
    //
    // We return the data unchanged here because
    // MongoDB's automatic encryption layer handles it.

    return data;
}

module.exports = {
    encryptFHIRData,
};