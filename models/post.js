const Sequelize = require("sequelize");

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        content: {
          type: Sequelize.STRING(1000),
          allowNull: false,
        },
        viewCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Post",
        tableName: "posts",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment, {onDelete: "CASCADE"});
    db.Post.hasMany(db.Notice, {onDelete: "CASCADE"});
    db.Post.belongsToMany(db.User, {
      through: "likecount",
      as: "postlikecount",
    });
    db.Post.hasMany(db.Photo);
  }
};
