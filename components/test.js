import React from 'react';
import { Stage, Layer, Star, Text } from 'react-konva';

function generateShapes() {
  return [...Array(10)].map((_, i) => ({
    id: i.toString(),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    isClicked: false
  }));
}

const INITIAL_STATE = generateShapes();

const App = () => {
    // console.log(INITIAL_STATE)
  const [stars, setStars] = React.useState(INITIAL_STATE);
  const [clickedData, setClickedData] = React.useState([])
  const handleClick = (e) => {
    const id = e.target.id();
    setStars(
      stars.map((star)=> {
        if (id!==star.id) {
          return {
            ...star,
            isClicked: star.isClicked
          }
        }
        if (star.isClicked) {
          setClickedData(
            clickedData.filter(item=>{
              return item !== star.id
            })
          )
        } else {
          setClickedData(
            [...clickedData, star.id]
          )
        }
        return{
          ...star,
          isClicked: !star.isClicked 
        }
      })
    )
  }
  return (

    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text={clickedData} />
        {stars.map((star) => {
          return (
          <Star
            key={star.id}
            id={star.id}
            x={star.x}
            y={star.y}
            numPoints={5}
            innerRadius={20}
            outerRadius={50}
            fill={star.isClicked ? "#89b717": "#00a4a7"}
            onClick={handleClick}
          />
        )})}
      </Layer>
    </Stage>
  );
};

export default App