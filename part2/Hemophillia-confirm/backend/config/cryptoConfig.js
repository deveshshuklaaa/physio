require("dotenv").config();

const fs = require("fs");
const path = require("path");

// =====================================
// MASTER KEY
// =====================================

const masterKeyPath = path.join(
  __dirname,
  "../master-key.txt"
);

const encodedKey = fs
  .readFileSync(masterKeyPath, "utf8")
  .trim();

const localMasterKey = Buffer.from(
  encodedKey,
  "base64"
);

if (localMasterKey.length !== 96) {
  throw new Error(
    `Invalid Master Key. Expected 96 bytes but received ${localMasterKey.length} bytes.`
  );
}

// =====================================
// KMS
// =====================================

const kmsProviders = {
  local: {
    key: localMasterKey,
  },
};

// =====================================
// KEY VAULT
// =====================================

const keyVaultNamespace =
  "encryption.__keyVault";

// =====================================
// crypt_shared
// =====================================

// Resolved once in config/cryptSharedPath.js (env, else the tarball at the
// repo root). This module exists to build data keys, so it cannot run
// without the library -- fail loudly rather than write cleartext.
const { requireCryptShared } = require("./cryptSharedPath");

const cryptSharedLibPath = requireCryptShared();

module.exports = {
  kmsProviders,
  keyVaultNamespace,
  cryptSharedLibPath,
};