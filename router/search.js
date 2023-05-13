const express = require("express");
const router = express.Router();
const Store = require("../models/store");
const Review = require("../models/review");
const Hashtag = require("../models/hashtag");
const Photo = require("../models/photo");
const User = require("../models/user");
const db = require("../models/index");
const { Op } = require("sequelize");
const getDistance = require("../lib/distance");
const { isLoggedIn } = require("./middlewares");

router.post("/hashtagsearch", async (req, res, next) => {
  try {
    const { latitude, longitude, selectedHashtag } = req.body;
    const hashtagStore = await Promise.all(
      selectedHashtag.map((hashtagName) => {
        return Store.findAll({
          attributes: ["id"],
          where: {
            "$Reviews.Hashtags.name$": hashtagName,
          },
          include: [
            {
              model: Review,
              attributes: ["id"],
              include: [
                {
                  model: Hashtag,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        });
      })
    );

    const convertId = hashtagStore.map((storeIdArr) => {
      return storeIdArr.map((idObject) => {
        return idObject.id;
      });
    });

    const countObj = {};
    for (let i = 0; i < convertId.length; i++) {
      convertId[i].forEach((id) => {
        countObj[id] = (countObj[id] || 0) + 1;
      });
    }
    const filterResult = Object.keys(countObj).filter((id) => {
      return countObj[id] === selectedHashtag.length ? true : false;
    });

    const storeInfo = await Store.findAll({
      where: {
        id: filterResult,
      },
      include: [
        {
          model: Review,
          attributes: ["id"],
          include: [
            {
              model: Hashtag,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });
    storeInfo.forEach((storeinfo) => {
      const dist = getDistance(
        latitude,
        longitude,
        storeinfo.latitude,
        storeinfo.longitude
      );
      storeinfo.dataValues.dist = dist;
    });
    storeInfo.sort(function (a, b) {
      return a.dataValues.dist - b.dataValues.dist;
    });

    return res.send(
      storeInfo.map((storeinfo) => {
        const hashtags = {};
        storeinfo.Reviews.forEach((review) => {
          review.Hashtags.forEach((hashtag) => {
            hashtags[hashtag.name] = (hashtags[hashtag.name] || 0) + 1;
          });
        });
        return {
          id: storeinfo.id,
          name: storeinfo.name,
          category: storeinfo.category,
          latitude: storeinfo.latitude,
          longitude: storeinfo.longitude,
          dist: storeinfo.dataValues.dist,
          hashtag: hashtags,
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/namesearch", async (req, res) => {
  try {
    const { latitude, longitude, searchKeyword } = req.body;
    const stores = await Store.findAll({
      where: {
        name: {
          [Op.like]: "%" + searchKeyword + "%",
        },
      },
      include: [
        {
          model: Review,
          attributes: ["id"],
          include: [
            {
              model: Hashtag,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    stores.forEach((storeInfo) => {
      const dist = getDistance(
        latitude,
        longitude,
        storeInfo.latitude,
        storeInfo.longitude
      );
      storeInfo.dataValues.dist = dist;
    });
    stores.sort(function (a, b) {
      return a.dataValues.dist - b.dataValues.dist;
    });

    return res.send(
      stores.map((storeInfo) => {
        const hashtags = {};
        storeInfo.Reviews.forEach((review) => {
          review.Hashtags.forEach((hashtag) => {
            hashtags[hashtag.name] = (hashtags[hashtag.name] || 0) + 1;
          });
        });
        return {
          id: storeInfo.id,
          name: storeInfo.name,
          category: storeInfo.category,
          latitude: storeInfo.latitude,
          longitude: storeInfo.longitude,
          dist: storeInfo.dataValues.dist,
          hashtag: hashtags,
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/storeInfo", async (req, res, next) => {
  try {
    const id = req.user === undefined ? null : req.user.dataValues.id;
    const store = await Store.findOne({
      where: { id: req.body.storeId },
      attributes: [
        "id",
        "name",
        "tel",
        "openingHours",
        "address",
        "category",
        "updatedAt",
        "latitude",
        "longitude",
        "viewCount",
      ],
      include: [
        {
          model: Review,
          attributes: ["content", "updatedAt"],
          include: [
            {
              model: Hashtag,
              attributes: ["name"],
            },
            {
              model: User,
              attributes: ["nickname"],
            },
            {
              model: Photo,
              attributes: ["filename"],
            },
          ],
        },
        {
          model: Photo,
          attributes: ["filename", "rep"],
        },
        {
          model: User,
          as: "storebookMark",
        },
      ],
    });
    await store.increment("viewCount", { by: 1 });
    const filter = store.dataValues.storebookMark.filter((bookmark) => {
      if (bookmark.dataValues.id == id) {
        return true;
      }
      return false;
    });

    const storeInfo = {
      id: store.dataValues.id,
      name: store.dataValues.name,
      tel: store.dataValues.tel,
      openingHours: store.dataValues.openingHours,
      address: store.dataValues.address,
      category: store.dataValues.category,
      updatedAt: store.dataValues.updatedAt,
      latitude: store.dataValues.latitude,
      longitude: store.dataValues.longitude,
    };
    const hashtags = {};

    const Reviews = store.Reviews.map((review) => {
      const hashtagArr = [];
      review.Hashtags.map((hashtag) => {
        hashtags[hashtag.name] = (hashtags[hashtag.name] || 0) + 1;
        hashtagArr.push(hashtag.name);
      });
      return {
        content: review.content,
        user: review.User.nickname,
        date: review.updatedAt,
        Hashtags: hashtagArr,
        photos: review.dataValues.Photos.map((filename) => {
          return filename.dataValues.filename;
        }),
      };
    });
    return res.send({
      bookmark: filter.length === 1 ? true : false,
      storeInfo,
      Reviews,
      hashtags,
      mainPhoto: store.Photos.filter((fileInfo) => {
        if (fileInfo.dataValues.rep === 1) {
          return true;
        } else {
          return false;
        }
      }).map((fileInfo) => {
        return fileInfo.dataValues.filename;
      })[0],
      Menus: store.Photos.filter((fileInfo) => {
        if (fileInfo.dataValues.rep === 0) {
          return true;
        } else {
          return false;
        }
      }).map((fileInfo) => {
        return fileInfo.dataValues.filename;
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/bookmark", isLoggedIn, async (req, res, next) => {
  try {
    const { storeId } = req.body;
    if (req.user) {
      await db.sequelize.models.bookMark.create({
        StoreId: storeId,
        UserId: req.user.dataValues.id,
      });
    }
    res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.delete("/bookmark", isLoggedIn, async (req, res, next) => {
  try {
    const { storeId } = req.body;
    if (req.user) {
      await db.sequelize.models.bookMark.destroy({
        where: { StoreId: storeId, UserId: req.user.dataValues.id },
      });
    }
    res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

module.exports = router;
