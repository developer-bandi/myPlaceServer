const express = require("express");
const router = express.Router();
const upload = require("../lib/multer");
const {isLoggedIn} = require("./middlewares");
const Review = require("../models/review");
const Photo = require("../models/photo");
const Store = require("../models/store");
const Hashtag = require("../models/hashtag");
const db = require("../models/index");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("cloudinary").v2;

router.post(
  "/writereview",
  isLoggedIn,
  upload.array("imgs[]"),
  async (req, res, next) => {
    try {
      const UserId = req.user.dataValues.id;
      const {StoreId, content, hashtags} = req.body;
      const createdReview = await Review.create({
        content: content,
        StoreId: Number(StoreId),
        UserId,
      });

      await Promise.all(
        req.files
          .map((file) => {
            return Photo.create({
              filename: file.filename,
              ReviewId: createdReview.dataValues.id,
            });
          })
          .concat(
            hashtags.map((id) => {
              return db.sequelize.models.ReviewHashtag.create({
                HashtagId: id,
                ReviewId: createdReview.dataValues.id,
              });
            })
          )
      );

      return res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(403);
      return next(error);
    }
  }
);

router.post(
  "/writestore",
  isLoggedIn,
  upload.fields([{name: "mainImg[]"}, {name: "menuImg[]"}]),
  async (req, res, next) => {
    try {
      const {name, tel, openingHours, address, latitude, longitude, category} =
        req.body;

      const createdStore = await Store.create({
        name: sanitizeHtml(name),
        tel: sanitizeHtml(tel),
        openingHours: sanitizeHtml(openingHours),
        address: sanitizeHtml(address),
        latitude,
        longitude,
        category,
      });

      await Promise.all(
        (req.files["mainImg[]"] === undefined ? [] : req.files["mainImg[]"])
          .map((file) => {
            return Photo.create({
              filename: file.filename,
              StoreId: createdStore.dataValues.id,
              rep: 1,
            });
          })
          .concat(
            (req.files["menuImg[]"] === undefined
              ? []
              : req.files["menuImg[]"]
            ).map((file) => {
              return Photo.create({
                filename: file.filename,
                StoreId: createdStore.dataValues.id,
              });
            })
          )
      );

      return res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(403);
      return next(error);
    }
  }
);

router.patch(
  "/storeinfo",
  isLoggedIn,
  upload.fields([{name: "mainImg[]"}, {name: "menuImg[]"}]),
  async (req, res, next) => {
    try {
      const {id, name, tel, openingHours, category, deletedImg = []} = req.body;
      const createdStore = await Store.update(
        {
          name: sanitizeHtml(name),
          tel: sanitizeHtml(tel),
          openingHours: sanitizeHtml(openingHours),
          category,
        },
        {where: {id}}
      );


      await Promise.all(
        (req.files["mainImg[]"] === undefined ? [] : req.files["mainImg[]"])
          .map((file) => {
            return Photo.create({
              filename: file.filename,
              StoreId: id,
              rep: 1,
            });
          })
          .concat(
            (req.files["menuImg[]"] === undefined
              ? []
              : req.files["menuImg[]"]
            ).map((file) => {
              return Photo.create({
                filename: file.filename,
                StoreId: id,
              });
            })
          )
          .concat(
            deletedImg.map((file) => {
              return Photo.destroy({
                where: {filename: file},
              });
            })
          )
      );
      deletedImg.map((filename) => {
        cloudinary.uploader.destroy(filename, function (result) {

        });
      });

      return res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(403);
      return next(error);
    }
  }
);

router.patch("/storeposition", isLoggedIn, async (req, res, next) => {
  try {
    const {id, latitude, longitude, address} = req.body;
    await Store.update(
      {
        latitude,
        longitude,
        address,
      },
      {
        where: {id},
      }
    );

    return res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.patch(
  "/review",
  isLoggedIn,
  upload.array("imgs[]"),
  async (req, res, next) => {
    try {
      const {
        deleteHashtag = [],
        addHashtag = [],
        deleteImg = [],
        id,
        content,
      } = req.body;
      const HashtagIddata1 = await Hashtag.findAll({
        where: {name: deleteHashtag},
        attributes: ["id"],
      });

      const HashtagIddata2 = await Hashtag.findAll({
        where: {name: addHashtag},
        attributes: ["id"],
      });

      const addHashtagId = HashtagIddata2.map((data) => {
        return data.dataValues.id;
      });

      const deleteHashtagId = HashtagIddata1.map((data) => {
        return data.dataValues.id;
      });
      await Promise.all(
        req.files
          .map((file) => {
            return Photo.create({
              filename: file.filename,
              ReviewId: id,
            });
          })
          .concat(
            addHashtagId.map((HashtagId) => {
              return db.sequelize.models.ReviewHashtag.create({
                HashtagId,
                ReviewId: id,
              });
            })
          )
          .concat(
            deleteImg.map((file) => {
              return Photo.destroy({
                where: {filename: file},
              });
            })
          )
          .concat(
            deleteHashtagId.map((HashtagId) => {
              return db.sequelize.models.ReviewHashtag.destroy({
                where: {
                  HashtagId,
                  ReviewId: id,
                },
              });
            })
          )
          .concat([
            Review.update({content: sanitizeHtml(content)}, {where: {id}}),
          ])
      );
      deleteImg.map((filename) => {
        cloudinary.uploader.destroy(filename, function (result) {
        });
      });
      return res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(403);
      return next(error);
    }
  }
);

module.exports = router;
