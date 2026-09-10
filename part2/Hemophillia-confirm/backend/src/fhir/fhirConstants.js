    // =======================================================
    // FHIR R4 Constants
    // Used across all FHIR Mapper files
    // =======================================================

    // ----------------------------
    // FHIR Profiles
    // ----------------------------

    const FHIR_PATIENT_PROFILE =
    "http://hl7.org/fhir/StructureDefinition/Patient";

    const FHIR_CONDITION_PROFILE =
    "http://hl7.org/fhir/StructureDefinition/Condition";

    const FHIR_OBSERVATION_PROFILE =
    "http://hl7.org/fhir/StructureDefinition/Observation";

    const FHIR_MEDICATIONSTATEMENT_PROFILE =
    "http://hl7.org/fhir/StructureDefinition/MedicationStatement";

    const FHIR_QUESTIONNAIRERESPONSE_PROFILE =
    "http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse";

    // ----------------------------
    // HL7 Code Systems
    // ----------------------------

    const HL7_IDENTIFIER =
    "http://terminology.hl7.org/CodeSystem/v2-0203";

    const HL7_CONDITION_CLINICAL =
    "http://terminology.hl7.org/CodeSystem/condition-clinical";

    const HL7_CONDITION_VERIFICATION =
    "http://terminology.hl7.org/CodeSystem/condition-ver-status";

    const HL7_CONDITION_CATEGORY =
    "http://terminology.hl7.org/CodeSystem/condition-category";

    const HL7_OBSERVATION_CATEGORY =
    "http://terminology.hl7.org/CodeSystem/observation-category";

    // ----------------------------
    // Standard Medical Terminology
    // ----------------------------

    const SNOMED_CT =
    "http://snomed.info/sct";

    const LOINC =
    "http://loinc.org";

    const RXNORM =
    "http://www.nlm.nih.gov/research/umls/rxnorm";

    // ----------------------------
    // Units
    // ----------------------------

    const UCUM =
    "http://unitsofmeasure.org";

    // ----------------------------
    // Your Project Identifier Systems
    // ----------------------------

    const PROJECT_PATIENT_SYSTEM =
    "urn:hemocare:patient-id";

    const PROJECT_CONDITION_SYSTEM =
    "urn:hemocare:condition-id";

    const PROJECT_OBSERVATION_SYSTEM =
    "urn:hemocare:observation-id";

    const PROJECT_MEDICATION_SYSTEM =
    "urn:hemocare:medication-id";

    const PROJECT_QUESTIONNAIRE_SYSTEM =
    "urn:hemocare:questionnaire-id";

    // ----------------------------
    // Organization
    // ----------------------------

    const ORGANIZATION_NAME =
    "HemoCare";

    const ORGANIZATION_SYSTEM =
    "urn:hemocare:organization";

    // ----------------------------
    // Country
    // ----------------------------

    const COUNTRY = "IN";

    module.exports = {

    // Profiles
    FHIR_PATIENT_PROFILE,
    FHIR_CONDITION_PROFILE,
    FHIR_OBSERVATION_PROFILE,
    FHIR_MEDICATIONSTATEMENT_PROFILE,
    FHIR_QUESTIONNAIRERESPONSE_PROFILE,

    // HL7
    HL7_IDENTIFIER,
    HL7_CONDITION_CLINICAL,
    HL7_CONDITION_VERIFICATION,
    HL7_CONDITION_CATEGORY,
    HL7_OBSERVATION_CATEGORY,

    // Terminology
    SNOMED_CT,
    LOINC,
    RXNORM,

    // Units
    UCUM,

    // Project
    PROJECT_PATIENT_SYSTEM,
    PROJECT_CONDITION_SYSTEM,
    PROJECT_OBSERVATION_SYSTEM,
    PROJECT_MEDICATION_SYSTEM,
    PROJECT_QUESTIONNAIRE_SYSTEM,

    // Organization
    ORGANIZATION_NAME,
    ORGANIZATION_SYSTEM,

    // Country
    COUNTRY,

    };