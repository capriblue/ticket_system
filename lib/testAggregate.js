const readline = require("readline");
// これはデータベースの初期化のために利用
require("dotenv").config({ path: `.env.local` });
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB);

const main = async () => {
  try {
    const database = client.db("test");
    const seats = database.collection("seat");
    const cursor = await seats.aggregate([
        {$addFields: {colStr: {$toString: '$col'}, floorStr: {$toString: '$floor'}, rowStr: {$toString: "$row"}}},
        {$match: {colStr: /(?<![0-9])(.*)(?![0-9])/, floorStr: /.*/, rowStr: /(?<![0-9])(RB)(?![0-9])/ }}
    ], {
        projection: {id:1, col:1,floor:1,state: 1}
    });
    if ((await seats.countDocuments({})) === 0) {
      // console.log("none");
    }
    // await cursor.forEach(item=>// console.log(item))
    const allValues = await cursor.toArray();
    // console.log(allValues);
    // console.log(allValues.length)
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
};

// 起動
(async () => {
  await main();
})();
