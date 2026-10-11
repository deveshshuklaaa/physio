require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

const mongoose = require("mongoose");
const { Binary } = require("mongodb");

// =====================================================
// MASTER KEY
// =====================================================

const { localMasterKey, dataKeyId: DATA_KEY_ID } = require("./secrets");

// =====================================================
// LOCAL KMS
// =====================================================

const kmsProviders = {
    local: {
        key: localMasterKey,
    },
};

// =====================================================
// KEY VAULT
// =====================================================

const keyVaultNamespace = "encryption.__keyVault";

// =====================================================
// DATA ENCRYPTION KEY
// =====================================================

// DEK id comes from CSFLE_DATA_KEY_ID via config/secrets.js, which validates
// it is a 16-byte UUID and throws otherwise. It is never logged: a wrong value
// makes every encrypted field fail to decrypt, and the startup noise that used
// to print it here also printed it into every container log.

// =====================================================
// CRYPT SHARED
// =====================================================

// CSFLE crypt_shared library. When it is absent we connect WITHOUT
// client-side field level encryption rather than refusing to start.
//
// !! DEV ONLY !! With CSFLE off, every field listed in schemaMap below --
// FHIR bundles, doctor registration data -- is written to MongoDB in
// CLEARTEXT. Acceptable only for local development against seeded fake
// patients. Confirm "CSFLE Enabled" appears in the boot log before this
// ever touches real patient records.
// Resolved in config/cryptSharedPath.js: CRYPT_SHARED_LIB_PATH if set
// (the Docker container), else the linux-x86_64 tarball at the repo root.
const {
    cryptSharedLibPath,
    cryptSharedAvailable: csfleAvailable,
} = require("./cryptSharedPath");

if (csfleAvailable) {
    console.log("🔐 crypt_shared:", cryptSharedLibPath);
} else {
    console.warn("⚠️  crypt_shared not found at:", cryptSharedLibPath);
    console.warn("⚠️  CSFLE DISABLED — encrypted fields stored in CLEARTEXT.");
    console.warn("⚠️  Development only. Do not use with real patient data.");
}

// =====================================================
// FHIR CSFLE SCHEMA
// =====================================================

const fhirSchema = {
    bsonType: "object",

    properties: {
        encryptedData: {
            encrypt: {
                bsonType: "object",

                keyId: [DATA_KEY_ID],

                algorithm:
                    "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
            },
        },
    },
};

// =====================================================
// SCHEMA MAP
// =====================================================

// =====================================================
// DOCTOR REGISTRATION CSFLE SCHEMA
// =====================================================

const doctorRegistrationSchema = {
  bsonType: "object",

  properties: {
    email: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    mobileNumber: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    medicalRegistrationNumber: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    medicalCouncil: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    qualification: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    specialization: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    hospitalName: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    city: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    rejectionReason: {
      encrypt: {
        bsonType: "string",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    registrationCertificate: {
      encrypt: {
        bsonType: "binData",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    professionalIdDocument: {
      encrypt: {
        bsonType: "binData",
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },
  },
};

// =====================================================
// SCHEMA MAP
// =====================================================

// The database name comes from MONGO_URI, never a literal. A hardcoded "hemophilia"
// here silently sent the staging app to production, and -- worse -- a schemaMap keyed
// on the wrong database matches nothing, so CSFLE rules would not apply and these two
// collections would be written in CLEARTEXT.
//
// Fail closed: no database in the URI means we cannot know which namespaces to
// encrypt, so we refuse to start rather than guess.
const DB_NAME = (() => {
  // Parse the path, not a loose regex: a naive /([^/?]+)/ match on a URI with no
  // database captures the host credentials as the "database name", which is worse
  // than failing outright.
  const raw = String(process.env.MONGO_URI || "");
  const afterScheme = raw.replace(/^mongodb(\+srv)?:\/\//, "");
  const slash = afterScheme.indexOf("/");
  const name =
    slash === -1 ? "" : afterScheme.slice(slash + 1).split("?")[0].trim();

  if (!name) {
    throw new Error(
      "MONGO_URI has no database path segment. Refusing to start: the CSFLE " +
      "schemaMap is keyed by database name, and guessing it would write PHI in cleartext."
    );
  }
  return decodeURIComponent(name);
})();

const schemaMap = {
  [`${DB_NAME}.fhirresources`]: fhirSchema,

  [`${DB_NAME}.doctorregistrationrequests`]:
    doctorRegistrationSchema,
};

// =====================================================
// DEBUG
// =====================================================

console.log("\n========== FHIR CSFLE CONFIG ==========");

console.log(
    "Namespace:",
    `${DB_NAME}.fhirresources`
);

console.log(
    "Encrypted field:",
    "encryptedData"
);

console.log(
    "Algorithm:",
    "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
);

// keyId deliberately not logged -- see the note at its definition.

// =====================================================
// CONNECT
// =====================================================

async function connectDB() {
    try {
        await mongoose.connect(
            process.env.MONGO_URI,
            {
                dbName: DB_NAME,

                // The models declare `encryptionType: "csfle"`, so mongoose
                // refuses to connect without an autoEncryption block at all.
                // Without the crypt_shared library we therefore still pass
                // one, but with bypassAutoEncryption -- the only mode that
                // needs neither crypt_shared nor mongocryptd. Writes go in as
                // cleartext; reads still decrypt anything already encrypted.
                autoEncryption: csfleAvailable
                    ? {
                          keyVaultNamespace,
                          kmsProviders,
                          schemaMap,

                          extraOptions: {
                              cryptSharedLibPath,
                          },
                      }
                    : {
                          keyVaultNamespace,
                          kmsProviders,
                          bypassAutoEncryption: true,
                      },
            }
        );

        console.log("=================================");
        console.log("✅ MongoDB Connected");
        console.log(csfleAvailable ? "🔐 CSFLE Enabled" : "⚠️  CSFLE DISABLED (cleartext)");
        console.log(
            "Database:",
            mongoose.connection.name
        );
        console.log("=================================");

    } catch (err) {
        console.error("❌ MongoDB Connection Failed");
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;