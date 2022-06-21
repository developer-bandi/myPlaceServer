const express = require("express");
const router = express.Router();
const Hashtag = require("../models/hashtag");

router.get("/", async (req, res, next) => {
  try {
    const allHashtag = await Hashtag.findAll({
      attributes: ["id", "category", "subject", "name", "viewCount"],
    });
    res.status(200);
    return res.send(allHashtag);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/rank", (req, res, next) => {
  const firstFilterCategory = Hashtag.findAll({
    attributes: ["subject", "name", "viewCount"],
    where: { category: "카페" },
    order: [["viewCount", "DESC"]],
    limit: 20,
  });
  const secondFilterCategory = Hashtag.findAll({
    attributes: ["subject", "name", "viewCount"],
    where: { category: "식당" },
    order: [["viewCount", "DESC"]],
    limit: 20,
  });
  const thirdFilterCategory = Hashtag.findAll({
    attributes: ["subject", "name", "viewCount"],
    where: { category: "주점" },
    order: [["viewCount", "DESC"]],
    limit: 20,
  });
  Promise.all([firstFilterCategory, secondFilterCategory, thirdFilterCategory])
    .then((data) => {
      res.status(200);
      return res.send({
        cafe: data[0],
        restaurant: data[1],
        pub: data[2],
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(403);
      return next(error);
    });
});

module.exports = router;
