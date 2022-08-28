// 노드메일러 설정하기!ㄴ
const mailer = require("nodemailer");
const mail = require("../config/mail");

const mailsend = {
  sendmail: function (tomail) {
    let transpoter = mailer.createTransport({
      service: "Naver",
      port: 587, // 25 587
      host: "smtp.naver.com",
      auth: {
        user: mail.user,
        pass: mail.pw,
      },
    });
    let mailoption = {
      from: mail.user,
      to: tomail.toEmail,
      subject: tomail.subject,
      html: tomail.text,
    };
    transpoter.sendMail(mailoption, (err, info) => {
      if (err) console.log(err);
      else console.log("send success", info.response);
    });
  },
};

module.exports = mailsend;
