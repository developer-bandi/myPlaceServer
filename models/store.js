const Sequelize = require("sequelize");

module.exports = class Store extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        name: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        tel: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        openingHours: {
          type: Sequelize.STRING(1000),
          allowNull: true,
        },
        address: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        category: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        latitude: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        longitude: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Store",
        tableName: "stores",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    db.Store.hasMany(db.Review);
    db.Store.hasMany(db.Photo);
    db.Store.belongsToMany(db.User, {
      through: "bookMark",
      as: "storebookMark",
    });
  }
};
