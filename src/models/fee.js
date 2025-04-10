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
      // define association here
    }
  };
  Fee.init({
    feeType: DataTypes.STRING,
    feeAmount: DataTypes.DECIMAL,
    feeDescription: DataTypes.TEXT,
    feeDate: DataTypes.DATEONLY,
    feeStatus: DataTypes.STRING,
    feeCreatedAt: DataTypes.DATE,
    feeUpdatedAt: DataTypes.DATE,
    feeDeletedAt: DataTypes.DATE,
    feeCreatedBy: DataTypes.STRING,
    feeUpdatedBy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Fee',
  });
  Fee.associate = function (models) {
    Fee.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return Fee;
};