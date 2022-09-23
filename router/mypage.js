const express = require("express");
const router = express.Router();
const {isLoggedIn} = require("./middlewares");
const User = require("../models/user");
const Store = require("../models/store");
const Review = require("../models/review");
const Hashtag = require("../models/hashtag");
const Photo = require("../models/photo");
const Post = require("../models/post");
const Comment = require("../models/comment");
const sanitizeHtml = require("sanitize-html");
const db = require("../models");
const {Op} = require("sequelize");
const sequelize = require("sequelize");
const cloudinary = require("cloudinary").v2;

router.get("/bookmark", isLoggedIn, async (req, res, next) => {
  try {
    const {id} = req.user.dataValues;
    const {page} = req.query;
    let bookMarkList = await db.sequelize.models.bookMark.findAndCountAll({
      where: {UserId: id},
      attributes: ["StoreId"],
      order: [["createdAt", "DESC"]],
      limit: 24,
      offset: (page - 1) * 24,
    });

    bookMarkList.rows = bookMarkList.rows.map((data) => {
      return data.dataValues.StoreId;
    });

    const bookMarkDataList = await Store.findAll({
      where: {id: {[Op.or]: bookMarkList.rows}},
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

    bookMarkDataList.map((bookmark) => {
      const {id, name, category, address, latitude, longitude, viewCount} =
        bookmark.dataValues;
      bookMarkList.rows[bookMarkList.rows.indexOf(id)] = {
        id,
        name,
        category,
        address,
        latitude,
        longitude,
        viewCount,
        photo: bookmark.dataValues.Photos.filter((photo) => {
          if (photo.dataValues.rep === 1) {
            return true;
          }
          return false;
        })[0]?.dataValues.filename,
        bookmark: bookmark.dataValues.storebookMark.length,
        review: bookmark.dataValues.Reviews.length,
      };
    });

    return res.send(bookMarkList);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/reviews",isLoggedIn, async (req, res, next) => {
  try {
    const {id} = req.user.dataValues;
    const {page} = req.query;
    const listLength = await User.findAll({
      where: {id},
      attributes: [],
      include: [
        {
          model: Review,
          attributes: [[sequelize.fn("COUNT", "id"), "count"]],
        },
      ],
    });
    const reviewList = await Review.findAll({
      where: {UserId:id},
      include: [
            {model: Hashtag, attributes: ["id", "name"]},
            {model: Photo, attributes: ["filename"]},
            {model: Store, attributes: ["name"]},
          ],
      order: [["createdAt", "DESC"]],
      limit: 20,
      offset: (page - 1) * 20,
    });
    return res.send({
      count: listLength[0].dataValues.Reviews[0].dataValues.count,
      rows: reviewList.map((review) => {
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
          createdAt: review.dataValues.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.delete("/review", isLoggedIn, async (req, res, next) => {
  try {
    const {id} = req.body;
    const photos = await Review.findOne({
      where: {id},
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
        }
      );
    });

    await Review.destroy({
      where: {id},
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
    const {id} = req.query;
    const review = await Review.findOne({
      where: {id},
      include: [
        {model: Hashtag, attributes: ["id", "name"]},
        {model: Photo, attributes: ["filename"]},
        {model: Store, attributes: ["name", "category", "address"]},
      ],
    });
    return res.send({
      id: review.dataValues.id,
      content: review.dataValues.content,
      storeInfo: {
        name: review.dataValues.Store.dataValues.name,
        category: review.dataValues.Store.dataValues.category,
        address: review.dataValues.Store.dataValues.address,
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
    const {id} = req.user.dataValues;
    const {page} = req.query;
    const {count, rows} = await Post.findAndCountAll({
      where: {UserId: id},
      order: [["createdAt", "DESC"]],
      limit: 20,
      offset: (page - 1) * 20,
      distinct: true,
      include: [
        {
          model: User,
          as: "postlikecount",
          attributes: ["id"],
        },
        {
          model: User,
          attributes: ["nickname"],
        },
        {model: Comment},
      ],
    });
    return res.send({
      count,
      rows: rows.map((post) => {
        return {
          id: post.dataValues.id,
          title: post.dataValues.title,
          content: post.dataValues.content,
          nickname: post.dataValues.User.dataValues.nickname,
          createdAt: post.dataValues.createdAt,
          viewCount: post.dataValues.viewCount,
          postlikecount: post.dataValues.postlikecount.length,
          comment: post.dataValues.Comments.length,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/comment", isLoggedIn, async (req, res, next) => {
  try {
    const {id} = req.user.dataValues;
    const {page} = req.query;
    const commentList = await Comment.findAndCountAll({
      where: {UserId: id},
      order: [["createdAt", "DESC"]],
      limit: 20,
      offset: (page - 1) * 20,
      distinct: true,
      attributes: ["id", "content", "createdAt", "PostId"],
      include: [
        {
          model: User,
          attributes: ["nickname"],
        },
      ],
    });
    return res.send({
      count: commentList.count,
      rows: commentList.rows.map((comment) => {
        return {
          id: comment.dataValues.id,
          content: comment.dataValues.content,
          createdAt: comment.dataValues.createdAt,
          PostId: comment.dataValues.PostId,
          nickname: comment.User.dataValues.nickname,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/info", isLoggedIn, async (req, res, next) => {
  try {
    const {id} = req.user.dataValues;
    const userInfo = await User.findOne({
      where: {id},
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
    const {id} = req.user.dataValues;
    const newUserInfo = await User.update(
      {
        nickname,
      },
      {where: {id}}
    );
    return res.send(newUserInfo);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

module.exports = router;
