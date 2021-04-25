const service = require("./users.service");

async function create(req, res, next) {
  if (req.body.data) {
    const newUser = req.body.data;
    const data = await service.create(newUser);
    return res.json({ data });
  }
  // next({ status: 400, message: `Missing update data` });
}

module.exports = {
  create,
};
