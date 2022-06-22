const express = require("express");
const router = express.Router();
const upload = require("../lib/multer");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Photo = require("../models/photo");
const { Op } = require("sequelize");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const db = require("../models/index");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("cloudinary").v2;

router.get("/list", async (req, res, next) => {
  try {
    const { page, order } = req.query;
    if (order === "likeCount") {
      const { count, rows: postList } = await Post.findAndCountAll({
        include: [
          {
            model: User,
            attributes: ["nickname", "id"],
          },
          {
            model: Comment,
            attributes: ["id"],
          },
          {
            model: User,
            as: "postlikecount",
            attributes: ["id"],
          },
        ],
      });
      postList.forEach((data, index) => {
        postList[index].dataValues.Comments =
          postList[index].dataValues.Comments.length;
      });
      postList.forEach((data, index) => {
        postList[index].dataValues.likelist = postList[
          index
        ].dataValues.postlikecount.map((data) => {
          return data.dataValues.id;
        });
        delete postList[index].dataValues.postlikecount;
      });
      postList.sort(function (a, b) {
        return b.dataValues.likelist.length - a.dataValues.likelist;
      });
      return res.send({
        count,
        postList: postList.splice((page - 1) * 10, page * 10),
      });
    }
    const { count, rows: postList } = await Post.findAndCountAll({
      order: [[order, "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          attributes: ["nickname", "id"],
        },
        {
          model: Comment,
          attributes: ["id"],
        },
        {
          model: User,
          as: "postlikecount",
          attributes: ["id"],
        },
      ],
    });
    postList.forEach((data, index) => {
      postList[index].dataValues.Comments =
        postList[index].dataValues.Comments.length;
    });
    postList.forEach((data, index) => {
      postList[index].dataValues.likelist = postList[
        index
      ].dataValues.postlikecount.map((data) => {
        return data.dataValues.id;
      });
      delete postList[index].dataValues.postlikecount;
    });

    res.status(200);
    return res.send({ count, postList });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { keyword, page, order } = req.query;
    const { count, rows: postList } = await Post.findAndCountAll({
      where: {
        [Op.or]: [
          {
            title: {
              [Op.like]: "%" + keyword + "%",
            },
          },
          {
            content: {
              [Op.like]: "%" + keyword + "%",
            },
          },
        ],
      },
      order: [[order, "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.status(200);
    return res.send({ count, postList });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/detail", async (req, res, next) => {
  try {
    const { id } = req.query;
    await Post.increment({ viewCount: 1 }, { where: { id } });
    const result = await Post.findOne({
      where: {
        id,
      },
      include: [
        {
          model: User,
          attributes: ["id", "nickname"],
        },
        {
          model: Comment,
          include: [{ model: User, attributes: ["nickname", "id"] }],
        },
        {
          model: User,
          as: "postlikecount",
          attributes: ["id"],
        },
        {
          model: Photo,
          attributes: ["filename"],
        },
      ],
    });

    result.dataValues.likelist = result.dataValues.postlikecount.map((data) => {
      return data.dataValues.id;
    });

    res.status(200);
    return res.send(result);
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/comment", isLoggedIn, async (req, res, next) => {
  const { PostId, content } = req.body;
  const { id, nickname } = req.user.dataValues;
  try {
    const newComment = await Comment.create({
      PostId,
      content: sanitizeHtml(content),
      UserId: id,
    });
    delete newComment.dataValues.UserId;
    newComment.dataValues.User = { id, nickname };
    return res.send(newComment);
  } catch (err) {
    console.error(error);
    res.status(403);
    return next(err);
  }
});

router.delete("/detail", isLoggedIn, async (req, res, next) => {
  const { PostId, UserId } = req.body;
  const { id } = req.user.dataValues;
  try {
    if (id === UserId) {
      const post = Post.findOne({
        where: { id: PostId },
        include: [
          {
            model: Photo,
            attributes: ["filename"],
          },
        ],
      });
      post.dataValues.Photos.map((filename) => {
        cloudinary.uploader.destroy(
          filename.dataValues.filename,
          function (result) {
            console.log(result);
          }
        );
      });
      await Post.destroy({
        where: { id: PostId },
      });
    }
    return res.send("ok");
  } catch (err) {
    console.error(error);
    res.status(403);
    return next(err);
  }
});

router.delete("/comment", isLoggedIn, async (req, res, next) => {
  const { CommentId, UserId } = req.body;
  const { id } = req.user.dataValues;
  try {
    if (id === UserId) {
      await Comment.destroy({
        where: { id: CommentId },
      });
    }
    return res.send("ok");
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.post("/likecount", isLoggedIn, async (req, res, next) => {
  const { PostId } = req.body;
  const { id } = req.user.dataValues;
  try {
    await db.sequelize.models.likecount.create({
      PostId,
      UserId: id,
    });
    return res.send("ok");
  } catch (err) {
    console.error(error);
    res.status(403);
    return next(err);
  }
});

router.delete("/likecount", isLoggedIn, async (req, res, next) => {
  const { PostId } = req.body;
  const { id } = req.user.dataValues;
  try {
    await db.sequelize.models.likecount.destroy({
      where: { UserId: id, PostId },
    });

    return res.send("ok");
  } catch (err) {
    console.error(error);
    res.status(403);
    return next(err);
  }
});

router.post(
  "/detail",
  isLoggedIn,
  upload.array("imgs[]"),
  async (req, res, next) => {
    const { title, content } = req.body;
    const { id } = req.user.dataValues;
    try {
      const newPost = await Post.create({
        title,
        content: sanitizeHtml(content),
        UserId: id,
      });
      console.log(req.file);
      await Promise.all(
        req.files.map((file) => {
          return Photo.create({
            filename: file.filename,
            PostId: newPost.dataValues.id,
          });
        })
      );
      return res.send("ok");
    } catch (error) {
      console.error(error);
      res.status(403);
      return next(error);
    }
  }
);

module.exports = router;
