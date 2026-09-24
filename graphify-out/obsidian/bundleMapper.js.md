---
source_file: "part2/Hemophillia-confirm/backend/src/fhir/bundleMapper.js"
type: "code"
community: "bundleMapper.js"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/bundleMapperjs
---

# bundleMapper.js

## Connections
- [[assessment.js]] - `imports_from` [EXTRACTED]
- [[conditionMapper.js]] - `imports_from` [EXTRACTED]
- [[fhir.js]] - `imports_from` [EXTRACTED]
- [[hemophiliaDetails.js_1]] - `imports_from` [EXTRACTED]
- [[medicationMapper.js]] - `imports_from` [EXTRACTED]
- [[observationMapper.js]] - `imports_from` [EXTRACTED]
- [[patientMapper.js]] - `imports_from` [EXTRACTED]
- [[questionnaireMapper.js]] - `imports_from` [EXTRACTED]
- [[toFHIRBundle()]] - `indirect_call` [INFERRED]
- [[toFHIRCondition()]] - `imports` [EXTRACTED]
- [[toFHIRMedicationStatement()]] - `imports` [EXTRACTED]
- [[toFHIRObservations()]] - `imports` [EXTRACTED]
- [[toFHIRPatient()]] - `imports` [EXTRACTED]
- [[toFHIRQuestionnaireResponse()]] - `imports` [EXTRACTED]
- [[{ toFHIRCondition }]] - `contains` [EXTRACTED]
- [[{ toFHIRMedicationStatement }]] - `contains` [EXTRACTED]
- [[{ toFHIRObservations }]] - `contains` [EXTRACTED]
- [[{ toFHIRPatient }]] - `contains` [EXTRACTED]
- [[{ toFHIRQuestionnaireResponse }]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/bundleMapperjs