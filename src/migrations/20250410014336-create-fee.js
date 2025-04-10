'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Fees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      feeType: {
        type: Sequelize.STRING
      },
      feeAmount: {
        type: Sequelize.DECIMAL
      },
      feeDescription: {
        type: Sequelize.TEXT
      },
      feeDate: {
        type: Sequelize.DATEONLY
      },
      feeStatus: {
        type: Sequelize.STRING
      },
      feeCreatedAt: {
        type: Sequelize.DATE
      },
      feeUpdatedAt: {
        type: Sequelize.DATE
      },
      feeDeletedAt: {
        type: Sequelize.DATE
      },
      feeCreatedBy: {
        type: Sequelize.STRING
      },
      feeUpdatedBy: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Fees');
  }
};