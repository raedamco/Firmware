const service = require("./spot.service");

async function create(company, location, subLocation, spotData) {
  const added = await service.create(company, location, subLocation, spotData);
}

// other calls from front end to call thi sin future
// TODO will need to also create corresponding sensor in  sensors collection
const tempPath = {
  company: "Ecotrust Events",
  location: "The Redd",
  subLocation: "Lot 1",
};
// TODO set default values for the object so less copy and paste
const tempSpotsData = [
  {
    Info: {
      ["Spot ID"]: 11,
    },
    Layout: {
      rotation: 0,
      x: 0,
      y: 0,
    },
    Occupancy: {
      Occupant: "",
      Occupied: false,
    },
    ["Spot Type"]: {
      ADA: false,
      EV: false,
      Hourly: false,
      Leased: false,
      Permit: false,
    },
  },
];

tempSpotsData.map((spotData) => {
  const { company, location, subLocation } = tempPath;
  create(company, location, subLocation, spotData);
});
