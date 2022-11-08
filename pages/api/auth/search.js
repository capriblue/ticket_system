import { MongoClient } from "mongodb";

const connectDB = async (col, row, floor) => {
  const client = new MongoClient(process.env.DB);
  try {
    // // console.log(col ,row, floor, "in")
    const database = client.db("test");
    const seats = database.collection("seat");
    const colReg = new RegExp(`(?<![0-9])(${col})(?![0-9])`);
    const rowReg = new RegExp(`(?<![0-9])(${row})(?![0-9])`);
    const floorReg = new RegExp(`(?<![0-9])(${floor})(?![0-9])`);
    // // console.log(colReg, rowReg, floorReg, "reg")
    const cursor = seats.aggregate([
      {
        $addFields: {
          colStr: { $toString: "$col" },
          floorStr: { $toString: "$floor" },
          rowStr: { $toString: "$row" },
        },
      },
      { $match: { colStr: colReg, floorStr: floorReg, rowStr: rowReg } },
    ]);
    const allValues = await cursor.toArray();
    return allValues;
  } catch{
    return []
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
};
export default async function handler(req, res) {
  const { querys } = req.body;
  // // console.log(querys, querys.length)
  if (querys.length === 0) {
    return res.status(200).json({ data: [] });
  }
  let arr = []
  for (let i = 0; i<querys.length; i++) {
    const data = await connectDB(querys[i].col, querys[i].row, querys[i].floor)
    // // console.log(data)
    arr = arr.concat(data)
  }
  const result = Array.from(
    new Map(arr.map(data=>[data.id,data])).values()
    )
  res.status(200).json({ result });
}
