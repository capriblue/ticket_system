
const data = require("../components/seatData.json")
function makeAlldata() {
  const res = data.seats.map(({ x, y, floor, col, row },i) => ({
    state: "clear",
    draw: { x, y },
    row,
    col,
    floor,
    id: i.toString()
  }));
  return res
}
exports.makeAlldata = makeAlldata