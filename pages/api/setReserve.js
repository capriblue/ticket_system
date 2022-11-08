import { MongoClient } from "mongodb";
export default async function clearSelectedData(req, res) {
  if (req.body ==="") {
    res.status(401).end("request is not valid")
    return
  }
  const data = req.body.data;
  const client = new MongoClient(process.env.DB);
  try {
    const selectedSeats = data.seatData;
    // console.log(selectedSeats);
    if (selectedSeats.length === 0) {
      throw "dataがない";
    }
    const database = client.db("test");
    const seatsCollection = database.collection("seat");
    for (let i = 0; i < selectedSeats.length; i++) {
      await seatsCollection.updateOne(
        { id: selectedSeats[i].id },
        { $set: { state: "reserved", whoReserved: {
            name: data.name,
            mail: data.mail,
            year: data.year,
            part: data.part,
        } } }
      );
    }
    // .json({})
  } catch {
    res.status(412).send({error: "処理中に想定外のエラーが発生しました。お手数をおかけしますがもう一度行ってください。何度も同じことが繰り返される場合は19藤井までご連絡ください。"})
  } finally {
    await client.close();
  }

  const form1 = encodeURIComponent(data.name);
  const form2 = encodeURIComponent(data.mail);
  const form3 = encodeURIComponent(data.year);
  const form4 = encodeURIComponent(data.part);
  const other = encodeURIComponent(data.other)
  const form5 = encodeURIComponent(data.tickets);
  const toForm = await fetch(process.env.GOOGLE_FORM_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `entry.1689540751=${form2}&entry.2035218243=${form1}&entry.652747152=${form3}&entry.1602243747=${form4}&entry.500264512=${other}&entry.2016225895=${form5}`,
  });
  const send = require("gmail-send")({
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    to: "capri4wrk@gmail.com",
    subject: `演奏会チケット予約完了のお知らせ`,
  });

  send(
    {
      html: `あなたは${data.tickets}の申請をしました。`,
    },
    (error, result, fullResult) => {
      if (error) console.error(error);
      // console.log(result);
    }
  );
  res.status(200).json({});
}
