require("dotenv").config();

module.exports = {
  development: {
    username: "root",
    password: process.env.SEQULIZE_PASSWORD_DEV,
    database: "myplace",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  test: {
    username: "root",
    password: process.env.SEQULIZE_PASSWORD,
    database: "myplace-test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "z1agms5g6gyhlsod",
    password: process.env.SEQULIZE_PASSWORD,
    database: "glkpfi3s9npnyqgz",
    host: "cxmgkzhk95kfgbq4.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    dialect: "mysql",
  },
};
