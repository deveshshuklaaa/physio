require("dotenv").config();

const { MongoClient } = require("mongodb");

async function rawTest() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();

    console.log("✅ Connected WITHOUT CSFLE");

    const db = client.db("hemophilia");
    const users = db.collection("users");

    console.log("DB:", db.databaseName);
    console.log("Collection:", users.collectionName);

    const user = await users
  .find({})
  .sort({ createdAt: -1 })
  .limit(1)
  .next();

    console.log("\n========== RAW MONGODB DATA ==========");

    if (!user) {
      console.log("❌ No users found");
    } else {
      console.dir(user, { depth: null });
    }

    console.log("======================================");
  } catch (error) {
    console.error("❌ RAW TEST FAILED");
    console.error(error);
  } finally {
    await client.close();
  }
}

rawTest();