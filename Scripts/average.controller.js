const service = require("./average.service");

async function create(company, location, subLocation, averageData) {
  const added = await service.create(
    company,
    location,
    subLocation,
    averageData
  );
}

// random date genertor/ data generator
//TODO check for duplicate dates
function randomDate(start, end) {
  var date = new Date(+start + Math.random() * (end - start));
  return date;
}
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
// TODO customizable values long term
const averageAmount = 750;
const tempAveragesData = [];
const tempDates = {
  start: new Date(2021, 2, 12), // 2-12-2021
  end: new Date(), // today
};
const tempPath = {
  company: "Ecotrust Events",
  location: "The Redd",
  subLocation: "Lot 1",
};

for (let i = 0; i < averageAmount; i++) {
  const { start, end } = tempDates;
  tempAveragesData.push({
    Average: randomNum(0, 10),
    Time: randomDate(start, end),
  });
}
tempAveragesData.map((spotData) => {
  const { company, location, subLocation } = tempPath;
  create(company, location, subLocation, spotData);
});
