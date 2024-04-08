const moment = require("moment");
const Admin = require("../models/adminModel");

async function expiryDate(id) {
  const admin = await Admin.findById(id);

  const date_string = admin.createdDate;
  let expiration = moment(date_string).format("YYYY-MM-DD");
  let current_date = moment().format("YYYY-MM-DD");
  let days = moment(current_date).diff(expiration, "days");

  if (days >= admin.expiryDate) {
    return "expired";
  } else {
    return "notExpired";
  }
}

module.exports = { expiryDate };
