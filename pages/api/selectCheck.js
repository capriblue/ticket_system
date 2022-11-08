import { MongoClient } from "mongodb";
export default async function handler(req, res) {
  if (req.body ==="") {
    res.status(401).end("request is not valid")
    return
  }
    const client = new MongoClient(process.env.DB);
    try {
        const selectedSeats = req.body.data
        
        const {socketId} = req.body
        // // console.log(selectedSeats, socketId)
        if (selectedSeats.length === 0) {
            // // console.log(selectedSeats, "sss");
            return res.status(200).json({success: true, alreadyReservedSeats: []})}
        const database = client.db("test");
        const seatsCollection = database.collection("seat");
        let alreadyReservedSeats = []
        for (let i = 0; i< selectedSeats.length; i++) {
            let data = await seatsCollection.findOne({id: selectedSeats[i].id},{
              projection: {
                _id: 0,
                state: 1,
                draw: 1,
                row: 1,
                col: 1,
                floor: 1,
                id: 1,
              },
            })
            // console.log(data)
            if (data.state !== "clear") {
                alreadyReservedSeats.push(data)
            } else {
                await seatsCollection.updateOne({id: selectedSeats[i].id}, {$set: {state: "selected", socketId}})
            }
        }
        // console.log(alreadyReservedSeats)
        res.status(200).json({success: (alreadyReservedSeats.length === 0), alreadyReservedSeats})
      } catch{
        res.status(412).send({error: "処理中に想定外のエラーが発生しました。お手数をおかけしますがもう一度行ってください。何度も同じことが繰り返される場合は19藤井までご連絡ください。"})
      } finally {
        await client.close();
      }
}

