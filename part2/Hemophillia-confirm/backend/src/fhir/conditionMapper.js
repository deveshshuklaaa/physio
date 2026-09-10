
    // src/fhir/conditionMapper.js

    const toFHIRCondition = (details) => {
    if (!details) return null;

    // Hemophilia Type Mapping
    let condition = {
        text: "Hemophilia",
        snomedCode: "",
    };

    switch (details.type) {
        case "A":
        condition = {
            text: "Hemophilia A",
            snomedCode: "66071002",
        };
        break;

        case "B":
        condition = {
            text: "Hemophilia B",
            snomedCode: "76670001",
        };
        break;

        case "C":
        condition = {
            text: "Hemophilia C",
            snomedCode: "",
        };
        break;

        default:
        condition = {
            text: "Hemophilia",
            snomedCode: "",
        };
    }

    return {

        resourceType: "Condition",

        id: details._id.toString(),

        meta: {
        profile: [
            "http://hl7.org/fhir/StructureDefinition/Condition",
        ],
        lastUpdated: details.updatedAt
            ? details.updatedAt.toISOString()
            : undefined,
        },

        identifier: [
        {
            use: "official",

            system: "urn:hemophilia-project:condition-id",

            value: details._id.toString(),
        },
        ],

        clinicalStatus: {
        coding: [
            {
            system:
                "http://terminology.hl7.org/CodeSystem/condition-clinical",

            code: "active",

            display: "Active",
            },
        ],
        },

        verificationStatus: {
        coding: [
            {
            system:
                "http://terminology.hl7.org/CodeSystem/condition-ver-status",

            code: "confirmed",

            display: "Confirmed",
            },
        ],
        },

        category: [
        {
            coding: [
            {
                system:
                "http://terminology.hl7.org/CodeSystem/condition-category",

                code: "problem-list-item",

                display: "Problem List Item",
            },
            ],
        },
        ],

        code: {
        coding: condition.snomedCode
            ? [
                {
                system: "http://snomed.info/sct",

                code: condition.snomedCode,

                display: condition.text,
                },
            ]
            : [],

        text: condition.text,
        },

        subject: {
        reference: `Patient/${details.patientId}`,
        },

        severity: details.severity
        ? {
            text: details.severity,
            }
        : undefined,

        onsetAge:
        details.ageAtDiagnosis !== undefined &&
        details.ageAtDiagnosis !== null
            ? {
                value: details.ageAtDiagnosis,

                unit: "years",

                system: "http://unitsofmeasure.org",

                code: "a",
            }
            : undefined,

        recordedDate: details.createdAt
        ? details.createdAt.toISOString()
        : undefined,
    };
    };

    module.exports = {
    toFHIRCondition,
    };