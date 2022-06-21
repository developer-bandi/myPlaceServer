const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");
const crypto = require("crypto-js");
const router = express.Router();
const mailer = require("../lib/mail");
const sanitizeHtml = require("sanitize-html");

router.get("/logincheck", async (req, res) => {
  try {
    if (req.user === undefined) {
      res.status(203);
      return res.send("로그인되지 않음");
    }
    const { id, nickname } = req.user.dataValues;
    res.status(200);
    return res.send({
      id,
      nickname,
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/join", isNotLoggedIn, async (req, res, next) => {
  const { localId, nickname, password, email } = req.body;
  try {
    const exUser = await Promise.all([
      User.findOne({ where: { localId: sanitizeHtml(localId) } }),
      User.findOne({ where: { nickname: sanitizeHtml(nickname) } }),
      User.findOne({ where: { email: sanitizeHtml(email) } }),
    ]);
    if (exUser[0] && exUser[1] && exUser[2]) {
      res.status(203);
      return res.send("존재하는 아이디와 닉네임과 이메일 입니다");
    }
    if (exUser[0] && exUser[1]) {
      res.status(203);
      return res.send("존재하는 아이디와 닉네임 입니다");
    }
    if (exUser[1] && exUser[2]) {
      res.status(203);
      return res.send("존재하는 닉네임과 이메일 입니다");
    }
    if (exUser[0] && exUser[2]) {
      res.status(203);
      return res.send("존재하는 아이디와 이메일 입니다");
    }
    if (exUser[0]) {
      res.status(203);
      return res.send("존재하는 아이디 입니다");
    }
    if (exUser[1]) {
      res.status(203);
      return res.send("존재하는 닉네임 입니다");
    }

    if (exUser[2]) {
      res.status(203);
      return res.send("존재하는 이메일 입니다");
    }

    const passwordBytes = crypto.AES.decrypt(
      password,
      process.env.PASSWORD_SECRET
    );
    const passwordDecrypted = passwordBytes.toString(crypto.enc.Utf8);
    const passwordHash = await bcrypt.hash(passwordDecrypted, 12);
    await User.create({
      localId,
      nickname,
      password: passwordHash,
      email,
    });
    res.status(201);
    return res.send("회원가입에 성공하였습니다");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      next(authError);
    }
    if (!user) {
      res.status(202);
      return res.send(info.message);
    }
    return req.login(user, (error) => {
      if (error) {
        res.status(403);
        return next(error);
      }
      res.status(200);
      return res.send("로그인 성공");
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout(function (error) {
    if (error) {
      res.status(403);
      return next(error);
    }
    req.session.destroy();
    return res.send("success");
  });
});

router.get("/kakao", passport.authenticate("kakao"));

router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: `${process.env.FRONT_URL}/login`,
  }),
  (req, res) => {
    res.redirect(process.env.FRONT_URL);
  }
);

router.get("/naver", passport.authenticate("naver", { authType: "reprompt" }));

router.get(
  "/naver/callback",

  passport.authenticate("naver", {
    failureRedirect: `${process.env.FRONT_URL}/login`,
  }),
  (req, res) => {
    res.redirect(process.env.FRONT_URL);
  }
);

router.post("/id", async (req, res, next) => {
  try {
    const randomNumber =
      Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    const email = sanitizeHtml(req.body.email);
    const user = await User.findOne({
      where: { email: email },
      attributes: ["localId"],
    });
    if (user) {
      let emailParam = {
        toEmail: email, // 수신할 이메일
        text: `My place 인증번호는 ${randomNumber} 입니다`,
      };
      mailer.sendGmail(emailParam);
      res.status(200);
      return res.send({
        number: crypto.AES.encrypt(
          JSON.stringify(randomNumber),
          process.env.PASSWORD_SECRET
        ).toString(),
        id: crypto.AES.encrypt(
          JSON.stringify(user.dataValues.localId),
          process.env.PASSWORD_SECRET
        ).toString(),
      });
    } else {
      res.status(203);
      return res.send("이메일이 존재하지 않습니다");
    }
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/password", async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    const newpasswordBytes = crypto.AES.decrypt(
      newPassword,
      process.env.PASSWORD_SECRET
    );
    const newpasswordDecrypted = newpasswordBytes.toString(crypto.enc.Utf8);
    const newpasswordHash = await bcrypt.hash(newpasswordDecrypted, 12);
    await User.update(
      { password: newpasswordHash },
      {
        where: { email },
      }
    );
    return res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.patch("/password", isLoggedIn, async (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordBytes = crypto.AES.decrypt(
    password,
    process.env.PASSWORD_SECRET
  );
  const passwordDecrypted = passwordBytes.toString(crypto.enc.Utf8);
  const user = await User.findOne({
    where: { id: req.user.dataValues.id },
  });
  const result = await bcrypt.compare(
    passwordDecrypted,
    user.dataValues.password
  );
  if (result) {
    const newpasswordBytes = crypto.AES.decrypt(
      newPassword,
      process.env.PASSWORD_SECRET
    );
    const newpasswordDecrypted = newpasswordBytes.toString(crypto.enc.Utf8);
    const newpasswordHash = await bcrypt.hash(newpasswordDecrypted, 12);
    await User.update(
      { password: newpasswordHash },
      {
        where: { id: req.user.dataValues.id },
      }
    );
    return res.send("ok");
  } else {
    console.error(error);
    res.status(203);
    return res.send("비밀번호가 일치하지 않습니다.");
  }
});

router.delete("/user", isLoggedIn, async (req, res, next) => {
  try {
    const id = 2;
    await User.destroy({ where: { id } });
    return res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

module.exports = router;
