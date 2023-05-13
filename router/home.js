const express = require("express");
const { Store, Photo, Review, User, Banner, Hashtag } = require("../models");
const router = express.Router();

router.get("/banner", async (req, res, next) => {
  try {
    const bannerData = await Banner.findAll({
      attributes: ["backgroundColor", "title", "summary", "router", "img"],
    });
    res.status(200);
    return res.send(bannerData);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/store", async (req, res, next) => {
  try {
    const storeTop10Arr = await Store.findAll({
      order: [["viewCount", "DESC"]],
      limit: 10,
      include: [
        {
          model: Photo,
        },
        {
          model: User,
          as: "storebookMark",
        },
        {
          model: Review,
        },
      ],
    });
    const result = storeTop10Arr.map((data) => {
      return {
        id: data.dataValues.id,
        name: data.dataValues.name,
        address: data.dataValues.address,
        viewCount: data.dataValues.viewCount,
        photo: data.dataValues.Photos.filter((data) => {
          if (data.dataValues.rep === 1) {
            return true;
          }
          return false;
        })[0]?.dataValues.filename,
        bookmark: data.dataValues.storebookMark.length,
        review: data.dataValues.Reviews.length,
        latitude: data.dataValues.latitude,
        longitude: data.dataValues.longitude,
      };
    });
    res.status(200);
    return res.send(result);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/review", async (req, res, next) => {
  try {
    const { page } = req.query;
    const { count, rows } = await Review.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
      distinct: true,
      include: [
        {
          model: Store,
          attributes: ["id", "name", "address", "latitude", "longitude"],
        },
        {
          model: User,
          attributes: ["nickname"],
        },
        {
          model: Hashtag,
          attributes: ["name"],
        },
      ],
    });

    res.status(200);
    return res.send({
      count,
      rows: rows.map((review) => {
        return {
          id: review.dataValues.id,
          content: review.dataValues.content,
          createdAt: review.dataValues.createdAt,
          storeId: review.dataValues.storeId,
          storeName: review.dataValues.Store.dataValues.name,
          storeAddress: review.dataValues.Store.dataValues.address,
          storeLatitude: review.dataValues.Store.dataValues.latitude,
          storeLongitude: review.dataValues.Store.dataValues.longitude,
          nickname: review.dataValues.User.dataValues.nickname,
          hashtag: review.Hashtags.map((hashtag) => {
            return hashtag.name;
          }),
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

module.exports = router;
