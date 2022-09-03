const Sequelize = require("sequelize");

module.exports = class Review extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: Sequelize.STRING(2000),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Review",
        tableName: "reviews",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    db.Review.belongsToMany(db.Hashtag, {through: "ReviewHashtag"});
    db.Review.belongsTo(db.Store);
    db.Review.belongsTo(db.User);
    db.Review.hasMany(db.Photo);
  }
};
