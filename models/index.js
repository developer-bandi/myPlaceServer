const Sequelize = require("sequelize");
const config = require("../config/config");
const Comment = require("./comment");
const Hashtag = require("./hashtag");
const Photo = require("./photo");
const Post = require("./post");
const Review = require("./review");
const Store = require("./store");
const User = require("./user");

const db = {};
const sequelize = new Sequelize(
  config.production.database,
  config.production.username,
  config.production.password,
  config.production
);

db.sequelize = sequelize;
db.Comment = Comment;
db.Hashtag = Hashtag;
db.Photo = Photo;
db.Post = Post;
db.Review = Review;
db.Store = Store;
db.User = User;

Comment.init(sequelize);
Hashtag.init(sequelize);
Photo.init(sequelize);
Post.init(sequelize);
Review.init(sequelize);
Store.init(sequelize);
User.init(sequelize);

Comment.associate(db);
Hashtag.associate(db);
Photo.associate(db);
Post.associate(db);
Review.associate(db);
Store.associate(db);
User.associate(db);

module.exports = db;
