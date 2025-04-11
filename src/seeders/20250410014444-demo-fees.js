'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Lấy ID của user đầu tiên
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM Users WHERE role = "user" LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length > 0) {
      const userId = users[0].id;

      await queryInterface.bulkInsert('Fees', [
        {
          feeType: 'Phí quản lý',
          feeAmount: 200000,
          feeDescription: 'Phí quản lý tháng 4/2025',
          feeDate: '2025-04-01',
          feeStatus: 'chưa thanh toán',
          userId: userId,
          feeCreatedAt: new Date(),
          feeUpdatedAt: new Date(),
          feeDeletedAt: null,
          feeCreatedBy: 'admin@example.com',
          feeUpdatedBy: 'admin@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          feeType: 'Phí gửi xe',
          feeAmount: 100000,
          feeDescription: 'Phí gửi xe tháng 4/2025',
          feeDate: '2025-04-01',
          feeStatus: 'đã thanh toán',
          userId: userId,
          feeCreatedAt: new Date(),
          feeUpdatedAt: new Date(),
          feeDeletedAt: null,
          feeCreatedBy: 'admin@example.com',
          feeUpdatedBy: 'admin@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Fees', null, {});
  }
};
