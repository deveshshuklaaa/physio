// Layer 2: THE BARRIER TEST. Proves layer2_helpers.assertTargets() refuses production before any
// other layer2_* file is allowed to write a single document.
//
// Owner: test-security-agent (docs/19 §10.2). Authority: docs/19 §8 constraint 14, §13 item 49;
// SECURITY.md 1.1. Promoted from the 8-case matrix the retarget of layer2_helpers.js was checked
// against, so the check lives in the suite instead of in a transcript.
//
// NEEDS NO DATABASE AND NO RUNNING APP. It never calls H.setup(). It re-requires
// layer2_helpers.js in a CHILD process with a different MONGO_URI / L2_BASE_URL / L2_DB and asks
// only whether assertTargets() allowed or aborted. Run it first, and run it anywhere:
//   node --max-old-space-size=384 --test --test-concurrency=1 migrations/test/layer2_guard_matrix.test.js
//
// Why a child process: STAGE_DB and BASE are resolved at module load, so one process can only ever
// test one target. Why the expected message is asserted and not just a non-zero exit: a missing
// module, a typo in the require path or a crypt_shared abort also exit non-zero, and a guard test
// that passes because the file failed to load is the worst possible kind of green.
const { test } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { spawnSync } = require("child_process");

const HELPERS = path.join(__dirname, "layer2_helpers.js");
const CWD = path.join(__dirname, "..", ".."); // backend/ — where node_modules lives

// The child loads the helpers and calls the guard. Nothing else: no connect, no HTTP.
const PROBE = `const H = require(${JSON.stringify(HELPERS)});
H.assertTargets();
process.stdout.write(JSON.stringify({ db: H.STAGE_DB, base: H.BASE }));`;

function probe({ uri, base, db }) {
  const env = { ...process.env };
  // Explicit: an inherited L2_DB / L2_BASE_URL from the owner's shell would silently rewrite the
  // very targets this matrix is varying.
  delete env.L2_DB; delete env.L2_BASE_URL; delete env.MONGO_URI;
  if (uri !== undefined) env.MONGO_URI = uri;
  if (base !== undefined) env.L2_BASE_URL = base;
  if (db !== undefined) env.L2_DB = db;
  const r = spawnSync(process.execPath, ["-e", PROBE], { cwd: CWD, env, encoding: "utf8", timeout: 60000 });
  return { code: r.status, out: r.stdout || "", err: r.stderr || "" };
}

// A loopback, non-80/443 app URL, so a db-only case is not also failing on the app guard.
const OK_BASE = "http://localhost:8080";
const OK_URI = "mongodb://127.0.0.1:27017/hemophilia_test";

function allows(name, args, expect) {
  test(`guard ALLOWS ${name}`, () => {
    const r = probe(args);
    assert.strictEqual(r.code, 0,
      `assertTargets() refused a legitimate test target (exit ${r.code}):\n${r.err.slice(0, 600)}`);
    const got = JSON.parse(r.out);
    assert.deepStrictEqual(got, expect,
      `the guard allowed the run but resolved the WRONG target: ${JSON.stringify(got)}`);
  });
}
function aborts(name, args, fragment) {
  test(`guard ABORTS ${name}`, () => {
    const r = probe(args);
    assert.notStrictEqual(r.code, 0,
      `assertTargets() ALLOWED ${name}. This is the only barrier between this suite and ` +
      `production patient data (docs/19 §8 constraint 14).`);
    assert.ok(r.err.includes(fragment),
      `it aborted, but NOT for the guard's reason — expected ${JSON.stringify(fragment)}, got:\n${r.err.slice(0, 600)}`);
    assert.strictEqual(r.out, "", "the probe printed a resolved target despite aborting");
  });
}

// =====================================================================
// 1. The database. The one name that is never legal, and the one shape that is.
// =====================================================================

aborts("the production db by name",
  { uri: "mongodb://127.0.0.1:27017/hemophilia", base: OK_BASE },
  'target db is "hemophilia" -- that is PRODUCTION');

aborts("the production db hidden behind a query string",
  { uri: "mongodb://127.0.0.1:27017/hemophilia?retryWrites=true&w=majority", base: OK_BASE },
  'target db is "hemophilia" -- that is PRODUCTION');

aborts("a db that does not declare itself non-production",
  { uri: "mongodb://127.0.0.1:27017/hemophilia_dev", base: OK_BASE },
  'is not named *_test or *_stage');

aborts("a db whose suffix only looks right (_testing, not _test)",
  { uri: "mongodb://127.0.0.1:27017/hemophilia_testing", base: OK_BASE },
  'is not named *_test or *_stage');

// These four pin the dbNameFromUri repair of 2026-10-12. Before it, a path-less URI resolved its
// AUTHORITY as the db name ("127.0.0.1:27017") and was refused by the *_test/*_stage rule — still
// fail-closed, but naming the wrong guard, and the "cannot determine" branch was unreachable
// except on an empty MONGO_URI. The abort must name the real reason.
aborts("a URI with no db path at all", { uri: "mongodb://127.0.0.1:27017", base: OK_BASE },
  "cannot determine the target db name");

aborts("an srv URI with no db path", { uri: "mongodb+srv://cluster.mongodb.net", base: OK_BASE },
  "cannot determine the target db name");

aborts("a URI whose path is an empty string", { uri: "mongodb://127.0.0.1:27017/?retryWrites=true", base: OK_BASE },
  "cannot determine the target db name");

aborts("an empty MONGO_URI", { uri: "", base: OK_BASE },
  "cannot determine the target db name");

// The repair must not have broken the ordinary forms: credentials, srv, and a query string.
allows("a URI with credentials in the authority",
  { uri: "mongodb://user:p%40ss@127.0.0.1:27017/hemophilia_test?authSource=admin", base: OK_BASE },
  { db: "hemophilia_test", base: OK_BASE });

allows("an srv URI with a db path",
  { uri: "mongodb+srv://user:pw@cluster.mongodb.net/hemophilia_test?retryWrites=true&w=majority", base: OK_BASE },
  { db: "hemophilia_test", base: OK_BASE });

allows("_test on a non-production port", { uri: OK_URI, base: OK_BASE },
  { db: "hemophilia_test", base: OK_BASE });

allows("_stage on the old staging port",
  { uri: "mongodb://127.0.0.1:27017/hemophilia_stage", base: "http://localhost:5001" },
  { db: "hemophilia_stage", base: "http://localhost:5001" });

// =====================================================================
// 2. L2_DB is an escape hatch for an oddly-named clone — not a way to reach production.
// =====================================================================

aborts("L2_DB pointed at production, even with a safe URI",
  { uri: OK_URI, base: OK_BASE, db: "hemophilia" },
  'target db is "hemophilia" -- that is PRODUCTION');

allows("L2_DB overriding an oddly-named clone, with a production URI path",
  { uri: "mongodb://127.0.0.1:27017/hemophilia?retryWrites=true", base: OK_BASE, db: "clone_test" },
  { db: "clone_test", base: OK_BASE });

// =====================================================================
// 3. The app URL. Production is nginx on 80/443; a test target is loopback and neither.
// =====================================================================

aborts("an app URL on port 80", { uri: OK_URI, base: "http://localhost:80" },
  "points at a production port");

aborts("an app URL on port 443", { uri: OK_URI, base: "https://127.0.0.1:443" },
  "points at a production port");

aborts("an app URL on port 80 with a trailing path", { uri: OK_URI, base: "http://127.0.0.1:80/" },
  "points at a production port");

aborts("a remote host", { uri: OK_URI, base: "http://10.0.0.5:8080" },
  "is not loopback");

aborts("a public hostname that merely contains 'localhost'",
  { uri: OK_URI, base: "http://localhost.evil.example:8080" },
  "is not loopback");

aborts("the production site by name", { uri: OK_URI, base: "https://hemophilia.example.com" },
  "is not loopback");

// =====================================================================
// 4. The guard is not something a caller can opt out of.
// =====================================================================

test("assertTargets is exported, so every write helper can re-check before it writes", () => {
  const r = probe({ uri: OK_URI, base: OK_BASE });
  assert.strictEqual(r.code, 0, r.err.slice(0, 600));
  // and api() re-checks it per request: pinned in source, since calling api() needs a live app.
  const fs = require("fs");
  const s = fs.readFileSync(HELPERS, "utf8").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  assert.match(s, /async function api\([\s\S]{0,120}?assertTargets\(\)/,
    "api() no longer re-checks assertTargets(): a mid-run env change would route requests off-target");
  assert.match(s, /function stageUri\(\)[\s\S]{0,200}?assertTargets\(\)/,
    "stageUri() no longer re-checks assertTargets()");
});
