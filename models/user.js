const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        localId: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        password: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        nickname: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        provider: {
          type: Sequelize.STRING(200),
          allowNull: false,
          defaultValue: "local",
        },
        snsId: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        email: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "User",
        tableName: "users",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    db.User.hasMany(db.Review);
    db.User.hasMany(db.Post);
    db.User.hasMany(db.Comment);
    db.User.hasMany(db.Notice, {
      onDelete: "CASCADE",
    });
    db.User.belongsToMany(db.Post, {
      through: "likecount",
      as: "userlikecount",
      onDelete: "CASCADE",
    });
    db.User.belongsToMany(db.Store, {
      through: "bookMark",
      as: "userbookMark",
      onDelete: "CASCADE",
    });
  }
};
