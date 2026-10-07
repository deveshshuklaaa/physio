require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// Single source for the CSFLE local-KMS master key.
//
// Read from the environment, never from a file in the repo: a key checked into
// source control decrypts every PHI field for anyone with repo access, and git
// history keeps it after the file is deleted.
//
// Fail closed. If the key is absent or malformed we throw here rather than let a
// caller fall back to an unencrypted client -- that fallback is what wrote the
// cleartext PHI documents the migration plan had to delete.

const encodedKey = (process.env.CSFLE_MASTER_KEY || "").trim();

if (!encodedKey) {
  throw new Error(
    "CSFLE_MASTER_KEY is not set. Refusing to continue: without it the client " +
    "cannot encrypt, and proceeding would write PHI in cleartext."
  );
}

const localMasterKey = Buffer.from(encodedKey, "base64");

if (localMasterKey.length !== 96) {
  throw new Error(
    `Invalid CSFLE_MASTER_KEY. Expected 96 bytes but received ${localMasterKey.length} bytes.`
  );
}

module.exports = { localMasterKey };
