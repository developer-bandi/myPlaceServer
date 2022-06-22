const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("./middlewares");
const User = require("../models/user");
const Store = require("../models/store");
const Review = require("../models/review");
const Hashtag = require("../models/hashtag");
const Photo = require("../models/photo");
const Post = require("../models/post");
const Comment = require("../models/comment");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("cloudinary").v2;

router.get("/bookmark", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.user.dataValues;
    const bookMarkList = await User.findOne({
      where: { id },
      attributes: ["id"],
      include: [
        {
          model: Store,
          as: "userbookMark",
        },
      ],
    });
    return res.send(
      bookMarkList.dataValues.userbookMark.map((bookmark) => {
        const { id, name, category, address, latitude, longitude } =
          bookmark.dataValues;
        return {
          id,
          name,
          category,
          address,
          latitude,
          longitude,
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/reviews", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.user.dataValues;
    const reviewList = await User.findOne({
      where: { id },
      attributes: ["id"],
      include: [
        {
          model: Review,
          include: [
            { model: Hashtag, attributes: ["id", "name"] },
            { model: Photo, attributes: ["filename"] },
            { model: Store, attributes: ["name"] },
          ],
        },
      ],
    });
    return res.send(
      reviewList.dataValues.Reviews.map((review) => {
        return {
          id: review.dataValues.id,
          content: review.dataValues.content,
          StoreName: review.dataValues.Store.dataValues.name,
          Hashtags: review.dataValues.Hashtags.map((hashtag) => {
            return [hashtag.dataValues.id, hashtag.dataValues.name];
          }),
          photo: review.dataValues.Photos.map((filename) => {
            return filename.dataValues.filename;
          }),
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.delete("/review", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.body;
    const photos = await Review.findOne({
      where: { id },
      include: [
        {
          model: Photo,
          attributes: ["filename"],
        },
      ],
    });
    photos.dataValues.Photos.map((filename) => {
      cloudinary.uploader.destroy(
        filename.dataValues.filename,
        function (result) {
          console.log(result);
        }
      );
    });

    await Review.destroy({
      where: { id },
    });
    return res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/review", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.query;
    const review = await Review.findOne({
      where: { id },
      include: [
        { model: Hashtag, attributes: ["id", "name"] },
        { model: Photo, attributes: ["filename"] },
        { model: Store, attributes: ["name", "category"] },
      ],
    });
    return res.send({
      id: review.dataValues.id,
      content: review.dataValues.content,
      storeInfo: {
        name: review.dataValues.Store.dataValues.name,
        category: review.dataValues.Store.dataValues.category,
      },
      Hashtags: review.dataValues.Hashtags.map((hashtag) => {
        return hashtag.dataValues.name;
      }),
      photo: review.dataValues.Photos.map((filename) => {
        return filename.dataValues.filename;
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/post", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.user.dataValues;
    const postList = await Post.findAll({
      where: { UserId: id },
      include: [
        {
          model: User,
          as: "postlikecount",
          attributes: ["id"],
        },
        { model: Comment },
      ],
    });

    return res.send(postList);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/comment", isLoggedIn, async (req, res, next) => {
  try {
    const id = 1;
    const commentList = await Comment.findAll({
      where: { UserId: id },
      include: [
        {
          model: Post,
          attributes: ["id"],
        },
      ],
    });

    return res.send(commentList);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/info", isLoggedIn, async (req, res, next) => {
  try {
    const id = 1;
    const userInfo = await User.findOne({
      where: { id },
      attributes: ["localId", "nickname", "provider", "createdAt", "email"],
    });
    return res.send(userInfo);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.patch("/nickname", isLoggedIn, async (req, res, next) => {
  try {
    const nickname = sanitizeHtml(req.body.nickname);
    const id = 1;
    const newUserInfo = await User.update(
      {
        nickname,
      },
      { where: { id } }
    );
    return res.send(newUserInfo);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

module.exports = router;
