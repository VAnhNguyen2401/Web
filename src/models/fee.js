'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Fee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Fee.belongsTo(models.User, { foreignKey: 'userId' });
    }
  };
  Fee.init({
    feeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    feeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    feeDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    feeDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    feeStatus: {
      type: DataTypes.ENUM('chưa thanh toán', 'đã thanh toán'),
      allowNull: false,
      defaultValue: 'chưa thanh toán'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    feeCreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    feeUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    feeDeletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    feeCreatedBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    feeUpdatedBy: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Fee',
    timestamps: true
  });
  return Fee;
};