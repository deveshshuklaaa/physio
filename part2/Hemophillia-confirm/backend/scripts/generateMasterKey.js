const crypto = require("crypto");

// Print to stdout; do not write a key file into the repo. Paste the line below
// into the root .env. Rotating this key requires re-wrapping the DEK in
// encryption.__keyVault, which re-encrypts nothing on its own -- see
// scripts/createDataKey.js.

const masterKey = crypto.randomBytes(96);

console.log(`CSFLE_MASTER_KEY=${masterKey.toString("base64")}`);
