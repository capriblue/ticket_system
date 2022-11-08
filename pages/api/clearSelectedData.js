import { MongoClient } from "mongodb";
export default async function clearSelectedData(req, res) {
  if (req.body ==="") {
    res.status(401).end("request is not valid")
    return
  }
    const client = new MongoClient(process.env.DB);
    try {
        const selectedSeats = req.body.data
        // console.log(selectedSeats)
        if (selectedSeats.length === 0) {
            return res.status(200).json({})}
        const database = client.db("test");
        const seatsCollection = database.collection("seat");
        for (let i=0; i < selectedSeats.length; i++) {
            await seatsCollection.updateOne({id: selectedSeats[i].id}, {$set: {state: "clear", socketId: null}}) 
        }
        res.status(200).json({})
      } finally {
        await client.close();
      }
}

