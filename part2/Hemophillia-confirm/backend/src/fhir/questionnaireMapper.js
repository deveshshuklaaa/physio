// =======================================================
// questionnaireMapper.js
// FHIR R4 QuestionnaireResponse Mapper
// =======================================================

const toFHIRQuestionnaireResponse = (assessment) => {
    if (!assessment) return null;

    return {
        resourceType: "QuestionnaireResponse",

        id: assessment._id.toString(),

        meta: {
            profile: [
                "http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse"
            ],

            lastUpdated: assessment.updatedAt
                ? assessment.updatedAt.toISOString()
                : undefined
        },

        status: "completed",

        subject: {
            reference: `Patient/${assessment.patientId}`
        },

        authored: assessment.createdAt
            ? assessment.createdAt.toISOString()
            : undefined,

        item: Array.isArray(assessment.answers)
            ? assessment.answers.map((q, index) => ({
                linkId: `${index + 1}`,

                text: q.question,

                answer: [
                    {
                        valueString: q.answer
                    }
                ]
            }))
            : [],

        extension: [
            ...(assessment.riskLevel
                ? [
                    {
                        url: "https://hemophilia-project.org/fhir/StructureDefinition/risk-level",
                        valueString: assessment.riskLevel
                    }
                ]
                : []),

            ...(assessment.score !== undefined
                ? [
                    {
                        url: "https://hemophilia-project.org/fhir/StructureDefinition/assessment-score",
                        valueInteger: assessment.score
                    }
                ]
                : [])
        ],

        note: Array.isArray(assessment.explanation)
            ? assessment.explanation
                .filter(Boolean)
                .map((e) => ({
                    text: e
                }))
            : []
    };
};

module.exports = {
    toFHIRQuestionnaireResponse
};