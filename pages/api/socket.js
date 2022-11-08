import { Server as ServerIO } from "socket.io";
// import { Server as NetServer } from "http";
import { MongoClient } from "mongodb";
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, res) => {
  if (!res.socket.server.io) {
    // console.log("New Socket.io");
    // adapt Next's net Server to http Server
    const httpServer = res.socket.server
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
    });
    // append SocketIO server to Next.js socket server response
    res.socket.server.io = io;
    io.on("connection", (socket)=>{
        // console.log(socket.id, "connected")
        socket.on("disconnect",()=>{
            // console.log(socket.id, "disconnect")
            disconnectHandler(socket.id)
        })
    })
  }
  res.end();
};

const disconnectHandler =  async (socketId) => {
    const client = new MongoClient(process.env.DB);
    try{
        const database = client.db("test");
        const seatsCollection = database.collection("seat");
        const cursor = await seatsCollection.find({socketId}, {projection: {_id: 1, state: 1}})
        const allSelectedData = await cursor.toArray()
        for (let i=0; i< allSelectedData.length; i++) {
            if (allSelectedData[i].state !== "selected") {
                continue
            }
            await seatsCollection.updateOne({_id: allSelectedData[i]._id}, {$set: {state: "clear", socketId: null}})
        }
        // console.log(socketId, "のクリーンアップが完了した。")
    } finally {
        await client.close();
    }
}

// //example code
// export default (req, res) => {
//     if (req.method === "POST") {
//       // get message
//       const message = req.body;
//       // dispatch to channel "message"
//       res?.socket?.server?.io?.emit("message", message);
//       // return message
//       res.status(201).json(message);
//     }
//   };

// export default (req, res) => {
//     if (req.method === "POST") {
//       // get message
//       const message = req.body;
//       // dispatch to channel "message"
//       res?.socket?.server?.io?.emit("message", message);
//       // return message
//       res.status(201).json(message);
//     }
//   };

// 
// import React,{useState,useRef, useEffect} from 'react'
// import io from "socket.io-client"
// let socket;
// export default function MySockets() {
//   const [messages, setMessages] = useState([])
//   const [inputText,setInputText] = useState("")

//   const [socketId, setSocketId] =useState("")
//   useEffect(()=>{
//     const socket = io.connect(process.env.BASE_URL, {path: "/api/socket"})
//     socket.on("connect", ()=>{
//       setSocketId(socket.id)
//     })
//     return ()=> socket.disconnect()
//   }, [])

//   const handleInputChange = (e) => {
//     setInputText(e.target.value)
//   }
//   const handleSend = async () => {
//     const aMessage = {
//       name: socketId,
//       text: inputText
//     }
//     const resp = await fetch("/api/message", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(aMessage)
//     })
//   }
//   return (
//     <div>
//       <div>
//         <input type="text" value={inputText} onChange={handleInputChange}/>
//         <button disabled={!inputText} onClick={handleSend}>送信</button>
//       </div>
//       {messages.length}
//       <ul>
//         {messages.map((data,idx)=>{
//         return (<li key={idx}>name: {data.name}, message: {data.text}</li>)
//         })}
//       </ul>
//     </div>
//   )
// }
