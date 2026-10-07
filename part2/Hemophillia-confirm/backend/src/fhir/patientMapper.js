    // src/fhir/patientMapper.js

    const { displayName } = require("../utils/displayName");

    // `user` carries the name parts (patientprofiles holds no name).
    const toFHIRPatient = (profile, user) => {
    if (!profile) return null;

    const familyName = user?.lastName || "";
    const givenNames = [user?.firstName, user?.middleName].filter(Boolean);

    return {
        resourceType: "Patient",

        id: profile.patientId,

        meta: {
        profile: [
            "http://hl7.org/fhir/StructureDefinition/Patient"
        ],
        lastUpdated: profile.updatedAt
            ? profile.updatedAt.toISOString()
            : undefined,
        },

        identifier: [
        {
            use: "official",

            type: {
            coding: [
                {
                system:
                    "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR",
                display: "Medical Record Number",
                },
            ],
            text: "Patient Identifier",
            },

            system: "urn:hemophilia-project:patient-id",

            value: profile.patientId,
        },
        ],

        active: true,

        name: [
        {
            use: "official",

            text: displayName(user),

            family: familyName,

            given: givenNames,
        },
        ],

        gender: ["male", "female", "other", "unknown"].includes(
        profile.gender?.toLowerCase()
        )
        ? profile.gender.toLowerCase()
        : "unknown",

        birthDate: profile.dob
        ? profile.dob.toISOString().split("T")[0]
        : undefined,

        telecom: [
        ...(profile.mobile
            ? [
                {
                system: "phone",
                value: profile.mobile,
                use: "mobile",
                rank: 1,
                },
            ]
            : []),

        ...(profile.email
            ? [
                {
                system: "email",
                value: profile.email,
                use: "home",
                rank: 2,
                },
            ]
            : []),
        ],

        address: [
        {
            use: "home",

            text: profile.address,

            city: profile.city,

            state: profile.state,

            postalCode: profile.pinCode,

            country: "IN",
        },
        ],

        contact: profile.emergencyName
        ? [
            {
                name: {
                text: profile.emergencyName,
                },

                relationship: [
                {
                    text: profile.emergencyRelationship,
                },
                ],

                telecom: profile.emergencyPhone
                ? [
                    {
                        system: "phone",
                        value: profile.emergencyPhone,
                        use: "mobile",
                    },
                    ]
                : [],
            },
            ]
        : [],

        managingOrganization: profile.hospitalName
        ? {
            display: profile.hospitalName,
            }
        : undefined,
    };
    };

    module.exports = {
    toFHIRPatient,
    };