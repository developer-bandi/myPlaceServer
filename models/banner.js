const Sequelize = require("sequelize");

module.exports = class Comment extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        backgroundColor: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        summary: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        router: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        img: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Banner",
        tableName: "banners",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
};
