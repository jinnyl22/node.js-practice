const dot = require("dotenv").config();

const mailer = {
  user: process.env.EMAIL,
  pw: process.env.EMAIL_PW,
};

// console.log(mailer);
module.exports = mailer;
