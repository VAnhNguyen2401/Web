'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Fees', [
      {
        feeType: 'Electricity',
        feeAmount: 200000,
        feeDescription: 'Monthly electricity bill',
        feeDate: '2025-04-01',
        feeStatus: 'Pending',
        feeCreatedAt: new Date(),
        feeUpdatedAt: new Date(),
        feeDeletedAt: null,
        feeCreatedBy: 'admin',
        feeUpdatedBy: 'admin'
      },
      {
        feeType: 'Water',
        feeAmount: 100000,
        feeDescription: 'Monthly water fee',
        feeDate: '2025-04-01',
        feeStatus: 'Paid',
        feeCreatedAt: new Date(),
        feeUpdatedAt: new Date(),
        feeDeletedAt: null,
        feeCreatedBy: 'admin',
        feeUpdatedBy: 'admin'
      },
      {
        feeType: 'Parking',
        feeAmount: 150000,
        feeDescription: 'Motorbike parking fee',
        feeDate: '2025-04-01',
        feeStatus: 'Pending',
        feeCreatedAt: new Date(),
        feeUpdatedAt: new Date(),
        feeDeletedAt: null,
        feeCreatedBy: 'admin',
        feeUpdatedBy: 'admin'
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Fees', null, {});
  }
};
