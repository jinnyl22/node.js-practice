// const mailer = require("./router/mailer");
// const authnum = "123456";
// let sendmail = {
//   toEmail: "rudghks09@naver.com",
//   subject: `안녕하세요 내코석 이메일 인증번호 입니다.`,
//   text: `님 반갑습니다. 이메일 인증번호는 <h1>${authnum}</h1> 입니다. 인증번호 칸에 입력 후 인증 확인 부탁드립니다.`,
// };
// mailer.sendmail(sendmail);
const jwtsign = require("./router/jwt");
const express = require("express");
const app = express();
const ejs = require("ejs");
app.set(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", "./view");

app.listen(8080, () => {
  console.log("server start");
});

app.get("/", (req, res) => {
  res.render("main.ejs");
});

app.post("/", (req, res) => {
  console.log(req);
});
