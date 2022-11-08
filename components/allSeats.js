import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

export default function SeatRenderer({seats, clicked}) {
  const  selectColor = (state) => {
    switch (state) {
      case "clear":
        return "#3c4";
      case "select":
        return "#ff3";
      case "selected":
        return "#fcf";
      case "reserved":
        return "#333";
    }
  }
  return (
    <Stage
      width={758 / 0.45112781954887216}
      height={600 / 0.45112781954887216}
      viewBox
    >
      <Layer>
        {seats.map((seat) => {
          return (
            <Rect
              key={seat.id}
              id={seat.id}
              x={seat.draw.x}
              y={seat.draw.y}
              width={12}
              height={12}
              fill={selectColor(seat.state)}
              onClick={clicked}
            />
          );
        })}
      </Layer>
    </Stage>
  )
}
export function AllSeats({ allseats, selectedSeatsRef, seatRed}) {
  let seatData = ""
  useEffect(()=>{
    seatData = allseats
  }, [seats])
  const [seats, setSeats] = useState(seatData);

  useEffect(()=>{
    setSeats(
      seats.map((seat)=> {
        if (seatRed.find(item=>item.id === seat.id) === undefined) {
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
  }, [seatRed])

  const handleClick = (e) => {
    // const id = e.target.value
    const id = e.target.id()
    // // console.log(id, "id")
    setSeats(
      seats.map((seat) => {
      if (id !== seat.id) {
        // // console.log(seat.id, seat.state)
        return {
          ...seat,
        };
      }
      switch (seat.state) {
        case "clear":
          selectedSeatsRef.current = [...selectedSeatsRef.current, {...seat}]
          return {
            ...seat,
            state: "select",
          };
        case "select":
          selectedSeatsRef.current = selectedSeatsRef.current.filter(item=>(item.id !== seat.id))
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
  function selectColor(state) {
    switch (state) {
      case "clear":
        return "#3c4";
      case "select":
        return "#ff3";
      case "selected":
        return "#3c4";
      case "reserved":
        return "#333";
    }
  }
  return (
    <>
      <Stage
        width={758 / 0.45112781954887216}
        height={600 / 0.45112781954887216}
        viewBox
      >
        <Layer>
          {seats.map((seat) => {
            return (
              <Rect
                key={seat.id}
                id={seat.id}
                x={seat.draw.x}
                y={seat.draw.y}
                width={12}
                height={12}
                fill={selectColor(seat.state)}
                onClick={handleClick}
              />
            );
          })}
        </Layer>
      </Stage>
      
      {/* <ul>
        {seats.map(item=>(
          <li ><button onClick={handleClick} value={item.id} style={{background: selectColor(item.state)}}>{item.id}, {item.state}, {item.row}, {item.col}</button></li>
        ))}
      </ul> */}
      <ul>
        {selectedSeatsRef.current.map((item) => (
          <li key={item.id}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </>
  );
}
