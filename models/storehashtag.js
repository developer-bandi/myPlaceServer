const Sequelize = require("sequelize");

module.exports = class Storehashtag extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        storeId: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        hashtagId: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        count: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Storehashtag",
        tableName: "storehashtags",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {}
};
