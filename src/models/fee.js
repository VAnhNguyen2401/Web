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
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    feeStatus: {
      type: DataTypes.ENUM('đã thanh toán', 'chưa thanh toán', 'quá hạn'),
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
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: function () {
        const date = new Date();
        date.setDate(date.getDate() + 15); // Mặc định 15 ngày kể từ ngày tạo
        return date;
      }
    },
    lateFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    isOverdue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Fee',
    timestamps: true
  });
  return Fee;
};