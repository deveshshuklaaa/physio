---
source_file: "part2/Hemophillia-confirm/backend/src/services/otpService.js"
type: "code"
community: "otpService.js"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/otpServicejs
---

# otpService.js

## Connections
- [[LOGIN]] - `contains` [EXTRACTED]
- [[OTP_EXPIRY_MINUTES]] - `imports` [EXTRACTED]
- [[OtpChallenge]] - `contains` [EXTRACTED]
- [[admin.js]] - `imports_from` [EXTRACTED]
- [[bcrypt_8]] - `contains` [EXTRACTED]
- [[createLoginOTP()]] - `indirect_call` [INFERRED]
- [[crypto_2]] - `contains` [EXTRACTED]
- [[doctorAuth.js]] - `imports_from` [EXTRACTED]
- [[emailService.js]] - `imports_from` [EXTRACTED]
- [[generateChallengeId()]] - `contains` [EXTRACTED]
- [[generateOTP()]] - `contains` [EXTRACTED]
- [[maskEmail()]] - `indirect_call` [INFERRED]
- [[otpAuth.js]] - `imports_from` [EXTRACTED]
- [[otpPolicy.js]] - `imports_from` [EXTRACTED]
- [[resendLoginOTP()]] - `indirect_call` [INFERRED]
- [[routesadminAuth.js]] - `imports_from` [EXTRACTED]
- [[routesauth.js]] - `imports_from` [EXTRACTED]
- [[sendLoginOTP()]] - `imports` [EXTRACTED]
- [[verifyLoginOTP()]] - `indirect_call` [INFERRED]
- [[{   OTP_EXPIRY_SECONDS,   OTP_EXPIRY_MINUTES,   RESEND_COOLDOWN_SECONDS, }]] - `contains` [EXTRACTED]
- [[{ sendLoginOTP }]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/otpServicejs