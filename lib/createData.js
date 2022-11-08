// これはデータベースの初期化のために利用
require("dotenv").config({ path: `.env.local` });
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB);


async function loadAllData() {
  try {
    const database = client.db("test");
    const seats = database.collection("all_seats");
    const cursor = await seats.find({});
    if ((await seats.countDocuments({})) === 0) {
      // console.log("none")
    }
    // await cursor.forEach(item=>// console.log(item))
    const allValues = await cursor.toArray()
    // console.log(allValues)
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
async function createData() {
  try {
    const database = client.db("test")
    const seat = database.collection("seat")
    if (await seat.countDocuments({}) !== 0) {
      throw "seatのデータベースはすでに作られています。これは破壊的な変更なので、実行する際はデータベースを別途削除してください。以下のサイトからできます。　https://cloud.mongodb.com/"
    }
    const allData = require("./makeAlldata").makeAlldata()
    const options = {ordered: true}
    const result = await seat.insertMany(allData, options)
    // console.log(result.insertedCount, "documents were inserted")
  } finally{
    await client.close()
  }
}
// loadAllData().catch(console.dir);
createData().catch(console.dir)