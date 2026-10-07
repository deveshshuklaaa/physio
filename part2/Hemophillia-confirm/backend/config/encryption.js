require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });


// =====================================
// MASTER KEY
// =====================================

const { localMasterKey } = require("./masterKey");

// =====================================
// LOCAL KMS PROVIDER
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
// CRYPT SHARED LIBRARY
// =====================================

const { requireCryptShared } = require("./cryptSharedPath");

const cryptSharedLibPath = requireCryptShared();

// =====================================
// EXPORT
// =====================================

module.exports = {
    kmsProviders,
    keyVaultNamespace,
    cryptSharedLibPath,
};