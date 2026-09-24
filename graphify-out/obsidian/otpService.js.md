---
source_file: "part2/Hemophillia-confirm/backend/src/services/otpService.js"
type: "code"
community: "admin.js"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/adminjs
---

# otpService.js

## Connections
- [[LoginOTP]] - `contains` [EXTRACTED]
- [[LoginOTP.js]] - `imports_from` [EXTRACTED]
- [[admin.js]] - `imports_from` [EXTRACTED]
- [[bcrypt_6]] - `contains` [EXTRACTED]
- [[createLoginOTP()]] - `indirect_call` [INFERRED]
- [[crypto_2]] - `contains` [EXTRACTED]
- [[doctorAuth.js]] - `imports_from` [EXTRACTED]
- [[emailService.js]] - `imports_from` [EXTRACTED]
- [[generateChallengeId()]] - `contains` [EXTRACTED]
- [[generateOTP()]] - `contains` [EXTRACTED]
- [[maskEmail()]] - `indirect_call` [INFERRED]
- [[otpAuth.js]] - `imports_from` [EXTRACTED]
- [[routesadminAuth.js]] - `imports_from` [EXTRACTED]
- [[routesauth.js]] - `imports_from` [EXTRACTED]
- [[sendLoginOTP()]] - `imports` [EXTRACTED]
- [[verifyLoginOTP()]] - `indirect_call` [INFERRED]
- [[{ sendLoginOTP }]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/adminjs