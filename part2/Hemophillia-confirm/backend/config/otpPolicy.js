// Single source for OTP timing. Login and password-reset both read from here.
//
// These constants used to be declared separately in services/otpService.js and
// routes/passwordReset.js, so every timing change had to be made twice and could
// silently drift. The migration plan's Phase 5 merges the two collections; the
// constants are unified ahead of it so there is one value to carry over.
//
// Seconds, not minutes: the policy is 3m05s, which a minutes-only constant
// cannot express.

const OTP_EXPIRY_SECONDS = 185; // 3 min 5 s
const RESEND_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

// For the email template, which speaks in whole minutes. Rounds DOWN so the copy
// never promises more time than the challenge actually has -- a user told "4
// minutes" for a code that dies at 3m05s reads it as a broken OTP.
const OTP_EXPIRY_MINUTES = Math.floor(OTP_EXPIRY_SECONDS / 60);

module.exports = {
  OTP_EXPIRY_SECONDS,
  OTP_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
};
