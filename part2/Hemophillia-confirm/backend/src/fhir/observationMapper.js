// =======================================================
// observationMapper.js
// FHIR R4 Observation Mapper
//
// Maps:
// 1. Assessment / Screening Factors
// 2. HemophiliaDetails
// =======================================================

const { withDerived } = require("../utils/assessmentDerive");

const toFHIRObservations = (assessment, details) => {
    const observations = [];

    // Phase 6: factors/q* are no longer stored, derive them from answers[].
    if (assessment) assessment = withDerived(assessment);

    // =====================================================
    // HELPER
    // =====================================================

    const createObservation = ({
        id,
        codeText,
        valueString,
        valueBoolean,
        valueInteger,
        valueDateTime,
        patientId,
        effectiveDateTime,
        notes,
    }) => {

        const observation = {
            resourceType: "Observation",

            id: id.toString(),

            meta: {
                profile: [
                    "http://hl7.org/fhir/StructureDefinition/Observation"
                ]
            },

            status: "final",

            category: [
                {
                    coding: [
                        {
                            system:
                                "http://terminology.hl7.org/CodeSystem/observation-category",

                            code: "survey",

                            display: "Survey"
                        }
                    ]
                }
            ],

            code: {
                text: codeText
            },

            subject: {
                reference: `Patient/${patientId}`
            },

            effectiveDateTime:
                effectiveDateTime ||
                new Date().toISOString()
        };

        // -------------------------------
        // Value
        // -------------------------------

        if (valueString !== undefined && valueString !== null) {
            observation.valueString = valueString;
        }

        if (valueBoolean !== undefined && valueBoolean !== null) {
            observation.valueBoolean = valueBoolean;
        }

        if (valueInteger !== undefined && valueInteger !== null) {
            observation.valueInteger = valueInteger;
        }

        if (valueDateTime !== undefined && valueDateTime !== null) {
            observation.valueDateTime = valueDateTime;
        }

        // -------------------------------
        // Notes
        // -------------------------------

        if (notes) {
            observation.note = [
                {
                    text: notes
                }
            ];
        }

        return observation;
    };


    // =====================================================
    // ASSESSMENT / SCREENING OBSERVATIONS
    // =====================================================

    if (assessment) {

        const patientId = assessment.patientId;

        const effectiveDateTime =
            assessment.createdAt
                ? assessment.createdAt.toISOString()
                : new Date().toISOString();


        // =================================================
        // SCORE
        // =================================================

        if (assessment.score !== undefined) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-score`,

                    codeText:
                        "Hemophilia Screening Assessment Score",

                    valueInteger:
                        assessment.score,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // RISK LEVEL
        // =================================================

        if (assessment.riskLevel) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-risk-level`,

                    codeText:
                        "Hemophilia Screening Risk Level",

                    valueString:
                        assessment.riskLevel,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // EMERGENCY FLAG
        // =================================================

        if (assessment.emergencyFlag !== undefined) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-emergency`,

                    codeText:
                        "Emergency Screening Flag",

                    valueBoolean:
                        assessment.emergencyFlag,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // STRONG SUSPICION FLAG
        // =================================================

        if (assessment.strongSuspicionFlag !== undefined) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-strong-suspicion`,

                    codeText:
                        "Strong Clinical Suspicion of Hemophilia",

                    valueBoolean:
                        assessment.strongSuspicionFlag,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q1 - EMERGENCY SYMPTOMS
        // =================================================

        if (assessment.q1EmergencySymptoms?.length) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q1-emergency-symptoms`,

                    codeText:
                        "Emergency Symptoms Reported",

                    valueString:
                        assessment.q1EmergencySymptoms.join(", "),

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q2 - BLEEDING FROM MINOR CUTS
        // =================================================

        if (assessment.q2BleedMinorCuts) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q2-minor-cuts`,

                    codeText:
                        "Bleeding After Minor Cuts",

                    valueString:
                        assessment.q2BleedMinorCuts,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q3 - DENTAL / SURGERY BLEEDING
        // =================================================

        if (assessment.q3DentalSurgeryBleeding) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q3-dental-surgery`,

                    codeText:
                        "Bleeding During Dental Procedures or Surgery",

                    valueString:
                        assessment.q3DentalSurgeryBleeding,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q4 - EASY BRUISING
        // =================================================

        if (assessment.q4Bruises) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q4-bruising`,

                    codeText:
                        "Easy Bruising",

                    valueString:
                        assessment.q4Bruises,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q5 - MUSCLE SWELLING
        // =================================================

        if (assessment.q5MuscleSwelling) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q5-muscle-swelling`,

                    codeText:
                        "Muscle Swelling or Bleeding",

                    valueString:
                        assessment.q5MuscleSwelling,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q6 - JOINT SWELLING
        // =================================================

        if (assessment.q6JointSwelling) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q6-joint-swelling`,

                    codeText:
                        "Joint Swelling",

                    valueString:
                        assessment.q6JointSwelling,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q7 - JOINTS LIST
        // =================================================

        if (assessment.q7JointsList?.length) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q7-joints`,

                    codeText:
                        "Joints Affected During Screening",

                    valueString:
                        assessment.q7JointsList.join(", "),

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q8 - JOINT WARMTH / TIGHTNESS
        // =================================================

        if (assessment.q8JointWarmthTightness) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q8-joint-warmth`,

                    codeText:
                        "Joint Warmth or Tightness",

                    valueString:
                        assessment.q8JointWarmthTightness,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q9 - BLOOD IN URINE / STOOL
        // =================================================

        if (assessment.q9BloodUrineStool) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q9-blood-urine-stool`,

                    codeText:
                        "Blood in Urine or Stool",

                    valueString:
                        assessment.q9BloodUrineStool,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q10 - FAMILY HISTORY
        // =================================================

        if (assessment.q10FamilyHistory) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q10-family-history`,

                    codeText:
                        "Family History of Bleeding Disorder",

                    valueString:
                        assessment.q10FamilyHistory,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q10 MALE RELATIVE FLAG
        // =================================================

        if (assessment.q10MaleRelativeFlag !== undefined) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q10-male-relative`,

                    codeText:
                        "Male Relative With Bleeding History",

                    valueBoolean:
                        assessment.q10MaleRelativeFlag,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q11 - HEAVY MENSTRUAL BLEEDING
        // =================================================

        if (assessment.q11HeavyMenstrual) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q11-heavy-menstrual`,

                    codeText:
                        "Heavy Menstrual Bleeding",

                    valueString:
                        assessment.q11HeavyMenstrual,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q12 - PREVIOUS TESTING
        // =================================================

        if (assessment.q12PreviousTesting) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q12-testing`,

                    codeText:
                        "Previous Testing for Bleeding Disorder",

                    valueString:
                        assessment.q12PreviousTesting,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // Q12 - FACTOR LEVEL LOW
        // =================================================

        if (assessment.q12FactorLow) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-q12-factor-low`,

                    codeText:
                        "Previous Low Clotting Factor Level",

                    valueString:
                        assessment.q12FactorLow,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // =================================================
        // SUMMARY
        // =================================================

        if (assessment.summaryText) {

            observations.push(
                createObservation({
                    id: `${assessment._id}-summary`,

                    codeText:
                        "Clinical Screening Summary",

                    valueString:
                        assessment.summaryText,

                    patientId,

                    effectiveDateTime
                })
            );
        }
    }


    // =====================================================
    // HEMOPHILIA DETAILS OBSERVATIONS
    // =====================================================

    if (details) {

        const patientId = details.patientId;

        const effectiveDateTime =
            details.updatedAt
                ? details.updatedAt.toISOString()
                : new Date().toISOString();


        // -----------------------------------------------
        // Bleeding Frequency
        // -----------------------------------------------

        if (details.bleedFrequency) {

            observations.push(
                createObservation({
                    id: `${details._id}-bleed-frequency`,

                    codeText:
                        "Bleeding Frequency",

                    valueString:
                        details.bleedFrequency,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Target Joint
        // -----------------------------------------------

        // Multi-value. FHIR valueString is a single string, so the joints
        // are joined -- older records hold a single string already.
        const targetJointText = (
            Array.isArray(details.targetJoint)
                ? details.targetJoint
                : [details.targetJoint]
        )
            .filter(Boolean)
            .join(", ");

        if (targetJointText) {

            observations.push(
                createObservation({
                    id: `${details._id}-target-joint`,

                    codeText:
                        "Target Joint",

                    valueString:
                        targetJointText,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Affected Joints
        // -----------------------------------------------

        if (details.jointsAffected?.length) {

            observations.push(
                createObservation({
                    id: `${details._id}-joints-affected`,

                    codeText:
                        "Affected Joints",

                    valueString:
                        details.jointsAffected.join(", "),

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Last Bleeding Episode
        // -----------------------------------------------

        if (details.lastBleedDate) {

            observations.push(
                createObservation({
                    id: `${details._id}-last-bleed`,

                    codeText:
                        "Last Bleeding Episode",

                    valueDateTime:
                        details.lastBleedDate.toISOString(),

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Physiotherapy
        // -----------------------------------------------

        if (details.underPhysiotherapy !== undefined) {

            observations.push(
                createObservation({
                    id: `${details._id}-physiotherapy`,

                    codeText:
                        "Currently Under Physiotherapy",

                    valueBoolean:
                        details.underPhysiotherapy,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Mobility Limitation
        // -----------------------------------------------

        if (details.mobilityLimitation) {

            observations.push(
                createObservation({
                    id: `${details._id}-mobility`,

                    codeText:
                        "Mobility Limitation",

                    valueString:
                        details.mobilityLimitation,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Assistive Devices
        // -----------------------------------------------

        if (details.assistiveDevices) {

            observations.push(
                createObservation({
                    id: `${details._id}-assistive-device`,

                    codeText:
                        "Assistive Devices",

                    valueString:
                        details.assistiveDevices,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Family History
        // -----------------------------------------------

        if (details.familyHistory) {

            observations.push(
                createObservation({
                    id: `${details._id}-details-family-history`,

                    codeText:
                        "Family History",

                    valueString:
                        details.familyHistory,

                    patientId,

                    effectiveDateTime
                })
            );
        }


        // -----------------------------------------------
        // Genetic Testing
        // -----------------------------------------------

        if (details.geneticTestingDone !== undefined) {

            observations.push(
                createObservation({
                    id: `${details._id}-genetic-testing`,

                    codeText:
                        "Genetic Testing Done",

                    valueString:
                        details.geneticTestingDone,

                    patientId,

                    effectiveDateTime
                })
            );
        }
    }


    // =====================================================
    // RETURN
    // =====================================================

    return observations;
};


module.exports = {
    toFHIRObservations
};