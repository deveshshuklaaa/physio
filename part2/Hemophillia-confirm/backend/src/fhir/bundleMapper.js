const { toFHIRPatient } = require("./patientMapper");
const { toFHIRCondition } = require("./conditionMapper");
const { toFHIRObservations } = require("./observationMapper");
const { toFHIRMedicationStatement } = require("./medicationMapper");
const { toFHIRQuestionnaireResponse } = require("./questionnaireMapper");

const toFHIRBundle = ({
    patientProfile,
    hemophiliaDetails,
    screeningSession,
    assessment,
}) => {

    const entries = [];

    // ========================================
    // PATIENT
    // ========================================

    if (patientProfile) {

        const patient = toFHIRPatient(patientProfile);

        if (patient) {
            entries.push({
                fullUrl: `Patient/${patient.id}`,
                resource: patient,
            });
        }
    }

    // ========================================
    // CONDITION
    // ========================================

    if (hemophiliaDetails) {

        const condition =
            toFHIRCondition(hemophiliaDetails);

        if (condition) {
            entries.push({
                fullUrl: `Condition/${condition.id}`,
                resource: condition,
            });
        }
    }

    // ========================================
    // OBSERVATIONS
    // ========================================

    if (screeningSession || hemophiliaDetails) {

        const observations =
            toFHIRObservations(
                screeningSession,
                hemophiliaDetails
            );

        observations.forEach((observation) => {

            entries.push({
                fullUrl: `Observation/${observation.id}`,
                resource: observation,
            });

        });
    }

    // ========================================
    // MEDICATION STATEMENTS
    // ========================================

    if (hemophiliaDetails) {

        const medications =
            toFHIRMedicationStatement(
                hemophiliaDetails
            );

        medications.forEach((medication) => {

            entries.push({
                fullUrl:
                    `MedicationStatement/${medication.id}`,

                resource: medication,
            });

        });
    }

    // ========================================
    // QUESTIONNAIRE RESPONSE
    // ========================================

    if (assessment) {

        const questionnaire =
            toFHIRQuestionnaireResponse(
                assessment
            );

        if (questionnaire) {

            entries.push({
                fullUrl:
                    `QuestionnaireResponse/${questionnaire.id}`,

                resource: questionnaire,
            });

        }
    }

    // ========================================
    // PATIENT ID
    // ========================================

    const patientId =
        patientProfile?.patientId ||
        hemophiliaDetails?.patientId ||
        assessment?.patientId;

    if (!patientId) {
        throw new Error(
            "Cannot create FHIR Bundle: patientId is missing"
        );
    }

    // ========================================
    // FINAL FHIR BUNDLE
    // ========================================

    return {

        resourceType: "Bundle",

        // ONE FHIR DOCUMENT PER PATIENT
        id: patientId,

        type: "collection",

        timestamp: new Date().toISOString(),

        total: entries.length,

        entry: entries,
    };
};

module.exports = {
    toFHIRBundle,
};