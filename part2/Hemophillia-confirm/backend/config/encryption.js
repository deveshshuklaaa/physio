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