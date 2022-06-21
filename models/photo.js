const Sequelize = require("sequelize");

module.exports = class Photo extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        filename: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Photo",
        tableName: "photos",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    db.Photo.belongsTo(db.Review);
    db.Photo.belongsTo(db.Store);
    db.Photo.belongsTo(db.Post);
  }
};
