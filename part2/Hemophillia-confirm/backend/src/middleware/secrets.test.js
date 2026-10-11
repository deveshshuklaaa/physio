// No-fallback guarantee for JWT_SECRET and the CSFLE key material.
//
// This is the check that fails if someone reintroduces a `process.env.X || "literal"`.
// It is grep-based on purpose: the failure mode is a fallback that works, so a
// behavioural test passes happily while the hole is open. The source is the evidence.
//
//   node src/middleware/secrets.test.js

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const BACKEND = path.resolve(__dirname, "../..");
const ROOT = path.resolve(BACKEND, "../../..");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js") && !e.name.endsWith(".orig")) out.push(p);
  }
  return out;
}

const sources = [...walk(path.join(BACKEND, "src")), ...walk(path.join(BACKEND, "config"))];
let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n          ${e.message}`); }
}

check("no `process.env.<SECRET> || \"literal\"` fallback anywhere", () => {
  const pattern = /process\.env\.(JWT_SECRET|CSFLE_MASTER_KEY|CSFLE_DATA_KEY_ID)\s*\|\|\s*["'`]/;
  const hits = [];
  for (const f of sources) {
    fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      if (line.trim().startsWith("//")) return;      // dead commented code cannot run
      if (pattern.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}`);
    });
  }
  assert.deepStrictEqual(hits, [], `fallback(s) found at:\n          ${hits.join("\n          ")}`);
});

check("no committed key material or DEK id literal in source", () => {
  const banned = [
    "hemo_fallback_secret_change_in_production",
    "mySuperSecretHemophiliaAppKey123",
    "cK8aqOqVSBCJKGnAHZMimw==",
    "70af1aa8-ea95-4810-8928-69c01d93229b",
  ];
  const hits = [];
  const SELF = path.resolve(__filename);   // this file names them in order to ban them
  for (const f of sources) {
    if (path.resolve(f) === SELF) continue;
    const body = fs.readFileSync(f, "utf8");
    for (const b of banned) if (body.includes(b)) hits.push(`${path.relative(ROOT, f)} → ${b.slice(0, 16)}…`);
  }
  assert.deepStrictEqual(hits, [], `literal(s) found:\n          ${hits.join("\n          ")}`);
});

check("secrets.js exports a usable JWT secret, 96-byte master key, 16-byte DEK id", () => {
  const s = require("../../config/secrets");
  assert.ok(s.JWT_SECRET && s.JWT_SECRET.length >= 32, "JWT_SECRET too short or missing");
  assert.strictEqual(s.localMasterKey.length, 96, "master key must be 96 bytes");
  assert.strictEqual(s.dataKeyId.buffer.length, 16, "DEK id must be a 16-byte UUID");
  assert.strictEqual(s.dataKeyId.sub_type, 4, "DEK id must be BSON subtype 4 (UUID)");
});

check("secrets.js FAILS CLOSED when JWT_SECRET is absent", () => {
  const { execFileSync } = require("child_process");
  const env = { ...process.env, JWT_SECRET: "" };
  // Point dotenv at an empty dir so neither env file can supply the value.
  let threw = false;
  try {
    execFileSync(process.execPath,
      ["-e", `process.env.JWT_SECRET='';require(${JSON.stringify(path.join(BACKEND, "config/secrets.js"))})`],
      { env: { ...env, DOTENV_CONFIG_PATH: "/nonexistent" }, stdio: "pipe" });
  } catch (e) {
    threw = true;
    assert.ok(/JWT_SECRET is not set/.test(e.stderr.toString()),
      `wrong error: ${e.stderr.toString().split("\n")[0]}`);
  }
  assert.ok(threw, "secrets.js started without JWT_SECRET -- it must throw");
});

check("both env files exist at the repo root and are mode 600", () => {
  for (const f of [".env", ".env.secrets"]) {
    const p = path.join(ROOT, f);
    assert.ok(fs.existsSync(p), `${f} missing at repo root`);
    const mode = (fs.statSync(p).mode & 0o777).toString(8);
    assert.strictEqual(mode, "600", `${f} is mode ${mode}, must be 600`);
  }
});

console.log(failures ? `\n  ${failures} FAILED\n` : "\n  all passed\n");
process.exit(failures ? 1 : 0);
