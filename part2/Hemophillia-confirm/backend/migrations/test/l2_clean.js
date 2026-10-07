// Sweep leftover Layer 2 fixtures from hemophilia_stage.
//
// Needed because an interrupted run never reaches its after() hook, so nothing
// sweeps its tagged docs -- and the next run's preflight then refuses to start on
// dirty state (correctly: results on dirty state are meaningless).
//
// Deliberately NOT wired into the preflight. An automatic sweep would hide the fact
// that a run died mid-flight, which is exactly what you want to notice.
//
// Usage:  node migrations/test/l2_clean.js            # list what is stale
//         node migrations/test/l2_clean.js --delete   # remove it
// 5 levels up: migrations/test -> migrations -> backend -> Hemophillia-confirm -> part2 -> repo root.
// (config/*.js use 4 because they sit one level shallower.)
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../../.env") });
const { MongoClient } = require("mongodb");

const STAGE_DB = "hemophilia_stage";
const DO_DELETE = process.argv.includes("--delete");

(async () => {
  // Rebuild from parts. A string replace of the db name is wrong: the same word can
  // appear earlier in the URI (user, cluster) and replacing that mangles the host.
  const raw = String(process.env.MONGO_URI || "");
  const m = raw.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)\/([^/?]*)(\?.*)?$/);
  if (!m || !m[2]) throw new Error("MONGO_URI has no database path segment");
  const uri = `${m[1]}/${STAGE_DB}${m[3] || ""}`;

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(STAGE_DB);
    // Guard: this script must never touch production, whatever the URI says.
    if (db.databaseName !== STAGE_DB) throw new Error(`ABORT: connected to ${db.databaseName}`);

    const colls = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name).filter((n) => !n.startsWith("system."));

    let total = 0;
    for (const name of colls) {
      const n = await db.collection(name).countDocuments({ __testRun: { $exists: true } });
      if (!n) continue;
      total += n;
      if (DO_DELETE) {
        const r = await db.collection(name).deleteMany({ __testRun: { $exists: true } });
        console.log(`deleted ${r.deletedCount} from ${name}`);
      } else {
        const d = await db.collection(name).findOne({ __testRun: { $exists: true } }, { projection: { __testRun: 1 } });
        console.log(`${name}: ${n} tagged (e.g. run ${d.__testRun})`);
      }
    }
    console.log(total === 0 ? "clean: no tagged docs" : `${DO_DELETE ? "removed" : "found"} ${total} tagged docs`);
    if (!DO_DELETE && total) console.log("re-run with --delete to remove");
  } finally {
    await client.close();
  }
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
