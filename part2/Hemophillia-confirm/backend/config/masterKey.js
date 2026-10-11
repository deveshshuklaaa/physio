// Back-compat shim. The master key now lives in config/secrets.js, which
// loads both root env files and fails closed on a missing or malformed key.
// Kept so existing requires keep working; prefer requiring secrets.js.
const { localMasterKey } = require("./secrets");

module.exports = { localMasterKey };
