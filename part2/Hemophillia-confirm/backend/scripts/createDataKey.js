require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

const { MongoClient, ClientEncryption } = require("mongodb");

const {
  kmsProviders,
  keyVaultNamespace,
  keyAltName,
} = require("../config/encryption");

const uri = process.env.MONGO_URI;

async function createKey() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    console.log("✅ Connected to Atlas");

    const clientEncryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders,
    });

    const keyVault = client
      .db("encryption")
      .collection("__keyVault");

    const existing = await keyVault.findOne({
      keyAltNames: keyAltName,
    });

    if (existing) {
      console.log("✅ Key already exists");
      console.log(existing._id);
      return;
    }

    const keyId = await clientEncryption.createDataKey("local", {
      keyAltNames: [keyAltName],
    });

    console.log("✅ Data Key Created");
    console.log(keyId);

  } finally {
    await client.close();
  }
}

createKey().catch(console.error);