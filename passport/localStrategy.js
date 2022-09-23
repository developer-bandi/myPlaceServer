const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const crypto = require("crypto-js");
const User = require("../models/user");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "localId",
        passwordField: "password",
      },
      async (localId, password, done) => {
        try {
          const MatchedUser = await User.findOne({ where: { localId } });
          if (MatchedUser) {
            var passwordBytes = crypto.AES.decrypt(
              password,
              process.env.PASSWORD_SECRET
            );
            var passwordDecrypted = passwordBytes.toString(crypto.enc.Utf8);
            const result = await bcrypt.compare(
              passwordDecrypted,
              MatchedUser.password
            );

            if (result) {
              done(null, MatchedUser);
            } else {
              done(null, false, { message: "비밀번호가 일치하지 않습니다" });
            }
          } else {
            done(null, false, { message: "가입되지 않은 회원입니다" });
          }
        } catch (error) {
          done(error);
        }
      }
    )
  );
};
