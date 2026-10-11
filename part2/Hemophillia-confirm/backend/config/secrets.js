const path = require("path");
const { Binary } = require("mongodb");

// Single source for every secret this backend reads.
//
// Two env files, both from the repo root, loaded in this order:
//   .env          non-secret configuration (ports, URIs, addresses)
//   .env.secrets  key material -- JWT_SECRET, CSFLE_MASTER_KEY, DEK id
//
// dotenv does not overwrite a variable that is already set, so a value
// injected by the container or the shell always wins over both files. That is
// what makes this safe to require from anything.
//
// NOTHING HERE HAS A FALLBACK, AND NOTHING HERE MAY GROW ONE.
// A fallback JWT secret means every token signed with the committed value
// validates in production; a fallback encryption key means PHI written in
// cleartext. Both failures are silent, which is why this file throws instead.

const ROOT = path.resolve(__dirname, "../../../..");

require("dotenv").config({ path: path.join(ROOT, ".env") });
require("dotenv").config({ path: path.join(ROOT, ".env.secrets") });

function required(name, why) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(
      `${name} is not set. Refusing to start: ${why} ` +
      `Set it in ${path.join(ROOT, ".env.secrets")} (chmod 600).`
    );
  }
  return value;
}

// ── JWT ──────────────────────────────────────────────────────
// The FastAPI engine (backend/app/auth.py) verifies tokens with this same
// value and fails loudly at import if it is unset. The two must match.
const JWT_SECRET = required(
  "JWT_SECRET",
  "without it tokens would be signed with a value an attacker can read."
);

// ── CSFLE master key ─────────────────────────────────────────
const CSFLE_MASTER_KEY = required(
  "CSFLE_MASTER_KEY",
  "without it the client cannot encrypt and would write PHI in cleartext."
);

const localMasterKey = Buffer.from(CSFLE_MASTER_KEY, "base64");
if (localMasterKey.length !== 96) {
  throw new Error(
    `Invalid CSFLE_MASTER_KEY. Expected 96 bytes but received ${localMasterKey.length}.`
  );
}

// ── CSFLE data key id ────────────────────────────────────────
// An identifier, not key material: it names which DEK in
// encryption.__keyVault to use. Wrong value here means every encrypted field
// fails to decrypt, so it is validated for shape, never printed.
const CSFLE_DATA_KEY_ID = required(
  "CSFLE_DATA_KEY_ID",
  "without it no schemaMap entry can name a key and encryption cannot be configured."
);

const dataKeyBytes = Buffer.from(CSFLE_DATA_KEY_ID, "base64");
if (dataKeyBytes.length !== 16) {
  throw new Error(
    `Invalid CSFLE_DATA_KEY_ID. Expected a 16-byte UUID but received ${dataKeyBytes.length} bytes.`
  );
}

const dataKeyId = new Binary(dataKeyBytes, Binary.SUBTYPE_UUID);

module.exports = { JWT_SECRET, localMasterKey, dataKeyId };
