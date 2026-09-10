require("dotenv").config();

const fs = require("fs");
const path = require("path");

// =====================================================
// crypt_shared library location — ONE definition
// =====================================================
//
// db.js, encryption.js and cryptoConfig.js each hardcoded their own copy of
// a developer-machine path to the library. All three were dead on every
// machine that actually runs this project, and fixing one copy silently
// left the other two wrong -- hence one definition, here.
//
// Resolution order:
//   1. CRYPT_SHARED_LIB_PATH from the environment — how the Docker container
//      gets it (docker-compose.yml bind-mounts the .so to /csfle/).
//   2. The enterprise tarball unpacked at the repo root, for running scripts
//      and `node src/index.js` straight from the host.
//
// Without this library CSFLE cannot auto-encrypt. db.js falls back to
// bypassAutoEncryption, which still READS encrypted data but WRITES
// cleartext — mixing plaintext into collections that already hold
// ciphertext. Deterministic fields (users.email) then stop matching on
// equality, so a login lookup silently finds nothing.

const REPO_ROOT = path.join(__dirname, "..", "..", "..", "..");

const DEFAULT_LIB_PATH = path.join(
  REPO_ROOT,
  "mongo_crypt_shared_v1-linux-x86_64-enterprise-amazon2023-8.3.9",
  "lib",
  "mongo_crypt_v1.so"
);

const cryptSharedLibPath =
  process.env.CRYPT_SHARED_LIB_PATH || DEFAULT_LIB_PATH;

const cryptSharedAvailable = fs.existsSync(cryptSharedLibPath);

/**
 * For the modules that cannot run at all without CSFLE (encryption.js,
 * cryptoConfig.js — they exist to create and use data keys). db.js does NOT
 * call this: it degrades to bypassAutoEncryption instead, loudly.
 */
function requireCryptShared() {
  if (!cryptSharedAvailable) {
    throw new Error(
      `crypt_shared library not found at:\n  ${cryptSharedLibPath}\n\n` +
        "Set CRYPT_SHARED_LIB_PATH, or unpack the linux-x86_64 enterprise " +
        "tarball at the repo root. Refusing to continue: without it this " +
        "process would write cleartext into encrypted collections."
    );
  }
  return cryptSharedLibPath;
}

module.exports = {
  cryptSharedLibPath,
  cryptSharedAvailable,
  requireCryptShared,
};
