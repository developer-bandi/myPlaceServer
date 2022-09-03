const express = require("express");
const router = express.Router();
const upload = require("../lib/multer");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Photo = require("../models/photo");
const {Op} = require("sequelize");
const {isLoggedIn} = require("./middlewares");
const db = require("../models/index");
const sanitizeHtml = require("sanitize-html");
const cloudinary = require("cloudinary").v2;

router.get("/list", async (req, res, next) => {
  try {
    const {page, order} = req.query;
    if (order === "likeCount") {
      const {count, rows} = await Post.findAndCountAll({
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
      rows.forEach((data, index) => {
        rows[index].dataValues.likelist = rows[
          index
        ].dataValues.postlikecount.map((data) => {
          return data.dataValues.id;
        });
      });
      rows.sort(function (a, b) {
        return b.dataValues.likelist.length - a.dataValues.likelist;
      });
      console.log(rows);
      return res.send({
        count,
        rows: rows.splice((page - 1) * 10, page * 10).map((post) => {
          return {
            id: post.dataValues.id,
            title: post.dataValues.title,
            content: post.dataValues.content,
            viewCount: post.dataValues.viewCount,
            createdAt: post.dataValues.createdAt,
            nickname: post.User.dataValues.nickname,
            comment: post.Comments.length,
            postlikecount: post.dataValues.likelist.length,
          };
        }),
      });
    }
    const {count, rows} = await Post.findAndCountAll({
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

    res.status(200);
    return res.send({
      count,
      rows: rows.map((post) => {
        return {
          id: post.dataValues.id,
          title: post.dataValues.title,
          content: post.dataValues.content,
          viewCount: post.dataValues.viewCount,
          createdAt: post.dataValues.createdAt,
          nickname: post.User.dataValues.nickname,
          comment: post.Comments.length,
          postlikecount: post.postlikecount.length,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const {keyword, page, order} = req.query;
    if (order === "likeCount") {
      const {count, rows} = await Post.findAndCountAll({
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
      rows.forEach((data, index) => {
        rows[index].dataValues.likelist = rows[
          index
        ].dataValues.postlikecount.map((data) => {
          return data.dataValues.id;
        });
      });
      rows.sort(function (a, b) {
        return b.dataValues.likelist.length - a.dataValues.likelist;
      });
      return res.send({
        count,
        rows: rows.splice((page - 1) * 10, page * 10).map((post) => {
          return {
            id: post.dataValues.id,
            title: post.dataValues.title,
            content: post.dataValues.content,
            viewCount: post.dataValues.viewCount,
            createdAt: post.dataValues.createdAt,
            nickname: post.User.dataValues.nickname,
            comment: post.Comments.length,
            postlikecount: post.dataValues.likelist.length,
          };
        }),
      });
    }
    const {count, rows} = await Post.findAndCountAll({
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
      order: [[order, "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.status(200);
    return res.send({
      count,
      rows: rows.map((post) => {
        return {
          id: post.dataValues.id,
          title: post.dataValues.title,
          content: post.dataValues.content,
          viewCount: post.dataValues.viewCount,
          createdAt: post.dataValues.createdAt,
          nickname: post.User.dataValues.nickname,
          comment: post.Comments.length,
          postlikecount: post.postlikecount.length,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.get("/detail", async (req, res, next) => {
  try {
    const {id} = req.query;
    await Post.increment({viewCount: 1}, {where: {id}});
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
          include: [{model: User, attributes: ["nickname", "id"]}],
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
  const {PostId, content} = req.body;
  const {id, nickname} = req.user.dataValues;
  try {
    const newComment = await Comment.create({
      PostId,
      content: sanitizeHtml(content),
      UserId: id,
    });
    delete newComment.dataValues.UserId;
    newComment.dataValues.User = {id, nickname};
    return res.send(newComment);
  } catch (err) {
    console.error(error);
    res.status(403);
    return next(err);
  }
});

router.delete("/detail", isLoggedIn, async (req, res, next) => {
  const {PostId, UserId} = req.body;
  const {id} = req.user.dataValues;
  try {
    if (id === UserId) {
      const post = await Post.findOne({
        where: {id: PostId},
        include: [
          {
            model: Photo,
            attributes: ["filename"],
          },
        ],
      });
      console.log(post);
      post.dataValues.Photos.map((filename) => {
        cloudinary.uploader.destroy(
          filename.dataValues.filename,
          function (result) {
            console.log(result);
            Post.destroy({
              where: {id: PostId},
            });
            return res.send("ok");
          }
        );
      });
    }
  } catch (error) {
    console.error(error);
    res.status(403);
    return next(error);
  }
});

router.delete("/comment", isLoggedIn, async (req, res, next) => {
  const {CommentId, UserId} = req.body;
  const {id} = req.user.dataValues;
  try {
    if (id === UserId) {
      await Comment.destroy({
        where: {id: CommentId},
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
  const {PostId} = req.body;
  const {id} = req.user.dataValues;
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
  const {PostId} = req.body;
  const {id} = req.user.dataValues;
  try {
    await db.sequelize.models.likecount.destroy({
      where: {UserId: id, PostId},
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
    const {title, content} = req.body;
    const {id} = req.user.dataValues;
    try {
      const newPost = await Post.create({
        title,
        content: sanitizeHtml(content),
        UserId: id,
      });
      console.log(req.files);
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
