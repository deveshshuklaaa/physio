require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });


// =====================================
// MASTER KEY
// =====================================

const { localMasterKey } = require("./masterKey");

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