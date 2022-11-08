import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";
const parse = (querys) => {
  const rows = querys.split(/\n/);
  const parsedQuerys = rows.map((inputRow) => {
    const splited = inputRow.split("/");
    // // console.log(splited, "splited")
    return {
      floor: splited[0],
      row: splited[1],
      col: splited[2],
    };
  });
  return parsedQuerys;
};
export default function Home() {
  const [socketId, setSocketId] = useState("");
  useEffect(() => {
    const socket = io.connect(process.env.BASE_URL, { path: "/api/socket" });
    socket.on("connect", () => {
      setSocketId(socket.id);
    });
    return () => socket.disconnect();
  }, []);
  const [querys, setQuery] = useState("");
  const [result, setResult] = useState([]);
  const [alreadyReserveedSeats, setAlreadyReservedSeats] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  useEffect(()=>{
    const data = localStorage.getItem("query") || ""
    setQuery(data)
    // console.log(data, querys)
  }, [])
  const submitQuery = async () => {
    const parsedQuerys = parse(querys);
    // // console.log(querys, parsedQuerys)
    const res = await fetch("/api/auth/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ querys: parsedQuerys }),
    });
    const data = await res.json();
    // // console.log(data);
    setResult(data.result.map((res) => ({ ...res, checked: false })));
    setAlreadyReservedSeats([]);
    localStorage.setItem("query", querys)
  };
  return (
    <>
      <textarea onChange={(e) => setQuery(e.target.value)} value={querys}></textarea>
      <input type="submit" onClick={submitQuery} value="確認" />
      <p>
        検索は複数行と正規表現も可能です。例えば1階4列目全部を表示するには"1/4/.+"と入力しましょう。また1/4/3＜改行＞2/4/1といった検索も対応しています。この場合二つが出てきます。googleフォームからキャンセルが出たらそれをコピペで貼り付けられます。
      </p>
      {selectedItem.map((item) => (
        <li key={item.key}>
          {item.state}, {item.id}
        </li>
      ))}
      {result.length}個ヒットしました。
      <Selecter
        state={result}
        setState={setResult}
        socketId={socketId}
        alreadyReserveedSeats={alreadyReserveedSeats}
        setAlreadyReservedSeats={setAlreadyReservedSeats}
      />
    </>
  );
}

const Selecter = ({
  state,
  setState,
  socketId,
  alreadyReserveedSeats,
  setAlreadyReservedSeats,
}) => {
  const changeChecked = (d) => {
    setState((prev) =>
      prev.map((item) => {
        if (item.id === d.id) {
          return { ...item, checked: !item.checked };
        } else {
          return { ...item };
        }
      })
    );
  };
  const handleClick = (selectedAll) => {
    setState((prev) => prev.map((item) => ({ ...item, checked: selectedAll })));
  };

  return (
    <>
      {alreadyReserveedSeats.length !== 0 ? (
        <ConfirmAlreadyReservedSeats seats={alreadyReserveedSeats} />
      ) : (
        <></>
      )}
      <ToReserved
        state={state}
        socketId={socketId}
        setAlreadyReservedSeats={setAlreadyReservedSeats}
      />
      <ToClear state={state} />
      <SelectAllHandler onClick={handleClick} />
      <SelectCheckBox changeChecked={changeChecked} state={state} />
    </>
  );
};

const ConfirmAlreadyReservedSeats = ({ seats }) => {
  return (
    <>
      <p>
        以下の席は一般団員が予約しようとしています。selectedとあるもののチェックを外してください。ない場合はもう一度確認を押してください。
      </p>
      {seats.map((seat) => (
        <li key={seat.id}>
          {seat.state}: {seat.floor}/{seat.row}/{seat.col}
        </li>
      ))}
    </>
  );
};
const ToReserved = ({ state, socketId, setAlreadyReservedSeats }) => {
  const [modalshow, setModalshow] = useState(false);
  const [data, setData] = useState();

  const handleClick = async () => {
    const selectedSeats = state.filter((item) => item.checked);
    if (selectedSeats.length === 0) {
      return;
    }
    const postRes = await fetch("/api/selectCheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: selectedSeats, socketId }),
    });
    const res = await postRes.json();
    // console.log(res, "re");
    if (res.success) {
      const e = {
        name: "管理者",
        year: 20,
        part: "SATB",
        mail: "kleines.ticket.system@gmail.com",
        other: "管理者フォームを利用して登録されました。",
        tickets: selectedSeats
          .map((item) => {
            return `${item.floor}/${item.row}/${item.col}`;
          })
          .join(),
        seatData: selectedSeats,
      };
      setData(e);
      setModalshow(true);
    } else {
      setAlreadyReservedSeats(res.alreadyReservedSeats);
      // console.log("fail");
    }
  };
  return (
    <>
      <Modal
        show={modalshow}
        data={data}
        setShow={setModalshow}
        socketId={socketId}
      />
      <input
        type="button"
        onClick={handleClick}
        value="選択しているものをすべてreservedにする"
      />
    </>
  );
};

const Modal = ({ show, data, setShow, socketId }) => {
  const router = useRouter();
  const confirmed = async () => {
    // // console.log(e);
    const postRes = await fetch("/api/setReserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, socketId }),
    });
    router.push({ pathname: "/confirmed", query: data });
  };
  const canceled = async () => {
    // await clearCheckedData()
    const postRes = await fetch("/api/clearSelectedData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: data.seatData }),
    });
    const res = await postRes.json();
    setShow(false);
  };
  if (!show) {
    return <></>;
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
  );
};

const ToClear = ({ state, socketId }) => {
  const [modalshow, setModalshow] = useState(false);
  const [data, setData] = useState();

  const handleClick = async () => {
    const selectedSeats = state.filter(
      (item) => item.checked && item.state === "reserved"
    );
    if (selectedSeats.length === 0) {
      return;
    }
    setData(selectedSeats);
    setModalshow(true);
  };
  
  return (
    <>
      <CancelModal
        show={modalshow}
        data={data}
        setShow={setModalshow}
        socketId={socketId}
      />
      <input
        type="button"
        onClick={handleClick}
        value="選択したもののうちreservedをclearにする。"
      />
    </>
  );
};

const CancelModal = ({ show, data, setShow, socketId }) => {
  const router = useRouter()
  const confirmed = async () => {
    const postRes = await fetch("/api/auth/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, socketId }),
    });
    setShow(false)
    router.reload()
  };
  if (!show) {
    return <></>;
  }
  return (
    <>
       <ul>
        {data.map(dd=>(JSON.stringify(dd)))}
      </ul>

      <button onClick={confirmed}>確定</button>
      <button onClick={()=>setShow(false)}>キャンセル</button>
    </>
  );
};
const SelectAllHandler = ({ onClick }) => {
  const [selectedAll, setSelectedAll] = useState(false);
  const label = selectedAll ? "すべての選択を解除" : "すべて選択";
  const handleClick = () => {
    const v = !selectedAll;
    setSelectedAll(v);
    onClick(v);
  };
  return <input type="button" onClick={handleClick} value={label} />;
};
const SelectCheckBox = ({ changeChecked, state }) => {
  // console.log(state);
  return (
    <ul>
      {state.map((value) => (
        <li key={value.id}>
          <input
            type="checkbox"
            onChange={() => changeChecked(value)}
            checked={value.checked}
          />
          {value.state}/{value.floor}/{value.row}/{value.col}
        </li>
      ))}
    </ul>
  );
};
