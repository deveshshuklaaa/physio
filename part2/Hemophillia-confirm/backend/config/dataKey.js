// DEK id, re-exported from the single source.
//
// Previously held the base64 literal and logged it at import. Both are gone:
// the value now comes from CSFLE_DATA_KEY_ID (config/secrets.js), which
// validates its shape and throws rather than letting a malformed id through.
const { dataKeyId } = require("./secrets");

module.exports = dataKeyId;
