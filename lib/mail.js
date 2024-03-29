const nodemailer = require("nodemailer");
// 메일발송 객체
const mailSender = {
  // 메일발송 함수
  sendGmail: function (param) {
    var transporter = nodemailer.createTransport({
      service: "gmail", // 메일 보내는 곳
      prot: 587,
      host: "smtp.gmlail.com",
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL, // 보내는 메일의 주소
        pass: process.env.EMAIL_PASSWORD, // 보내는 메일의 비밀번호
      },
    });
    // 메일 옵션
    var mailOptions = {
      from: process.env.EMAIL, // 보내는 메일의 주소
      to: param.toEmail, // 수신할 이메일
      subject: "my place 인증번호 입니다", // 메일 제목
      text: param.text, // 메일 내용
    };

    // 메일 발송
    transporter.sendMail(mailOptions, function (error, info) {});
  },
};

module.exports = mailSender;
