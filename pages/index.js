import React, { useState, useEffect, Suspense } from "react";
import dynamic from 'next/dynamic'
import io from "socket.io-client"
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { MongoClient } from "mongodb";


export default function Home({Seats}) {
  const [seats, setSeats] = useState(Seats)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [alreadyReservedSeats, setAlreadyReservedSeats] = useState([])

  const [socketId, setSocketId] =useState("")
  useEffect(()=>{
    const socket = io.connect(process.env.BASE_URL, {path: "/api/socket"})
    socket.on("connect", ()=>{
      setSocketId(socket.id)
    })
    return ()=> socket.disconnect()
  }, [])

  const seatClicked = (e) => {
    const id = e.target.id()
    setSeats(
      seats.map((seat) => {
      if (id !== seat.id) {
        return {
          ...seat,
        };
      }
      switch (seat.state) {
        case "clear":
        setSelectedSeats([...selectedSeats, {...seat}])
          return {
            ...seat,
            state: "select",
          };
        case "select":
          setSelectedSeats(selectedSeats.filter(item=>(item.id!== seat.id)))
          return {
            ...seat,
            state: "clear",
          };
        default:
          return {
            ...seat,
          };
      }
    }));
  };
  useEffect(()=>{
    setSeats(
      seats.map((seat)=> {
        if (alreadyReservedSeats.find(item=>item.id === seat.id) === undefined) {
          return {
            ...seat
          }
        } else {
          return {
            ...seat,
            state: "reserved"
          }
        }
      })
    )
    setSelectedSeats(selectedSeats.filter((seat)=>(alreadyReservedSeats.find(item=>item.id=== seat.id) === undefined)))
  },[alreadyReservedSeats])
  const seatClear = () => {
    setSelectedSeats([])
    if (alreadyReservedSeats.length === 0){
      setSeats(Seats)
      return
    }
    const newSeats = Seats.map(seat=>{
      const item = alreadyReservedSeats.find(reservedSeat=> reservedSeat.id===seat.id)
      if (item) {
        // console.log(item)
        return item
      } else {
        return seat
      }
    })
    setSeats(newSeats)
    setAlreadyReservedSeats([])
  }
  const SeatRenderer = dynamic(() => import("../components/allSeats"), {ssr: false,});
  return (
    <>
    {/* <ul>
    {
      seats.map(item=>(<li>{JSON.stringify(item)}</li>))
    }
    </ul>    */}
    <Suspense fallback={<Loading/>}>
    <SeatRenderer seats={seats} clicked={seatClicked}/>
    </Suspense>
    <SelectedSeats selectedSeats={selectedSeats}/>
    <ClearAll setClear={seatClear}/>
    {alreadyReservedSeats.length !== 0 ? <AlreadySelectedSeats alreadyReservedSeats={alreadyReservedSeats}/> : <></>}
    <Form selectedSeats={selectedSeats} setAlreadyReservedSeats={(seats)=>setAlreadyReservedSeats(seats)} socketId={socketId}/> 
    </>
  )
}
const Loading = () => {
  return (
    <div>
      <p>ロード中です</p>
      <p>変化のない場合、フリーズしている可能性が大いにあります。PCで開いてください。</p>
    </div>
  )
}
const SelectedSeats = ({selectedSeats}) => {
  return (
    <ul>
       {selectedSeats.map(item=>(<li>{JSON.stringify(item)}</li>))}
    </ul>
  )
}
const ClearAll = ({setClear}) => {
  return (
    <button onClick={setClear}>席の選択をリセット</button>
  )
}
const AlreadySelectedSeats =  ({alreadyReservedSeats}) => {
  return (
    <>
    <p>誰かに取得された</p>
    <ul>
      {alreadyReservedSeats.map(
        
        item=>(<li>{JSON.stringify(item)}</li>))}
    </ul>
    </>
  )
}

const Form = ({selectedSeats, setAlreadyReservedSeats, socketId}) =>{
  const [show, setShow] = useState(false)
  const [data, setData] = useState();
  const [existTicketMessage, setExistTicketMessage] = useState("")
  const {register, handleSubmit, formState: {errors}} = useForm()
  const checkSeats = async (e) => {
    if (selectedSeats.length === 0) {
      setExistTicketMessage("チケットを少なくとも1つ選択してください。")
      return
    }
    if (selectedSeats.length > 15) {
      setExistTicketMessage("チケットの選択数が15を超えています。複数回にわけて申請してください。")
      return
    }
    setExistTicketMessage("")
    setAlreadyReservedSeats([])
    const postRes = await fetch("/api/selectCheck", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: selectedSeats, socketId})
    })
    const res = await postRes.json()
  //  // console.log(await res.json())
    if (res.success) {
      e.tickets = selectedSeats.map(item=>{
        return `${item.floor}/${item.row}/${item.col}`
      }).join()
      e.seatData = selectedSeats
      setData(e)
      setShow(true)
    } else {
      setAlreadyReservedSeats(res.alreadyReservedSeats)
    }
  }
  return (
    <>
       <Modal show={show} data={data} setShow={setShow} socketId={socketId}/>
    <form  onSubmit={handleSubmit(checkSeats)}>
 {errors.name && <div>名前を入力してください。</div>}
      <input
        {...register("name", { required: true })}
        placeholder="名前"
      />
        {errors.year && <div>学年を入力してください。</div>}
      <select {...register("year", { required: true })}>
        <option>学年</option>
        {[22, 21, 20, 19, 18, 17].map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      {errors.part && <div>パートを入力してください。</div>}
      <select {...register("part", { required: true })}>
        <option value="">パート</option>
        {["S", "A", "T", "B"].map((part) => (
          <option key={part} value={part}>
            {part}
          </option>
        ))}
      </select>
     {errors.mail && <div>メールアドレスを正しく入力してください。</div>}
      <input
        name=""
        placeholder="example@example.com"
        {...register("mail", { required: true, pattern: {
          value:  /^[\w\-._]+@[\w\-._]+\.[A-Za-z]+/,
          message: "入力形式がメールアドレスではありません。"
        } })}
      />
      <textarea  {...register("other")} placeholder="担当者に伝えたいこと" />
      {existTicketMessage && <div>{existTicketMessage}</div>}
      <input type="submit" value="確認"/>
    </form>
    </>
  )
}


const Modal = ({show,data,setShow, socketId }) => {
  const router = useRouter()
  const confirmed =  async ()=> {
    // // console.log(e);
    const postRes = await fetch("/api/setReserve", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data, socketId})
    })
    router.push({pathname: "/confirmed", query: data})
  }
  const canceled = async () => {
    // await clearCheckedData()
    const postRes = await fetch("/api/clearSelectedData", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: data.seatData})
    })
    const res = await postRes.json()
    setShow(false)
  }
  if (!show) {
    return <></>
  }
  return (
    <div>
      以下の項目で申請しますか？
      <ul>
        <li key="name">{data.name}</li>
        <li key="year">{data.year}</li>
        <li key="part">{data.part}</li>
        <li key="mail">{data.mail}</li>
        <li key="tickets">{data.tickets}</li>
        <li key="other">{data.other}</li>
      </ul>
      <button onClick={confirmed}>確定</button>
      <button onClick={canceled}>キャンセル</button>
    </div>
  )
}

export async function getServerSideProps() {
  const client = new MongoClient(process.env.DB);
  try {
    const database = client.db("test");
    const seats = database.collection("seat");
    const allSeatsRes = await seats.find(
      {},
      {
        projection: {
          _id: 0,
          state: 1,
          draw: 1,
          row: 1,
          col: 1,
          floor: 1,
          id: 1,
        },
      }
    );
    const allSeats = await allSeatsRes.toArray();
    return {
      props: {
        Seats: allSeats,
      },
    };
  } finally {
    await client.close();
  }
}
