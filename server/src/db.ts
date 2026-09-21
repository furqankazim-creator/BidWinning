import mongoose from "mongoose";

export async function connectDb() {
  if (process.env.USE_MEMORY_DB === "1") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri("vendoriq"));
    console.log("[db] in-memory MongoDB started (data is lost on restart)");
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (or set USE_MEMORY_DB=1 for local dev)");
  await mongoose.connect(uri);
  console.log("[db] connected to MongoDB");
}
