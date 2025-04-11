'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem bảng Users có tồn tại không
    const tableExists = await queryInterface.describeTable('Users');

    if (tableExists) {
      // Thêm các cột mới nếu chưa tồn tại
      const columns = Object.keys(tableExists);

      if (!columns.includes('firstName')) {
        await queryInterface.addColumn('Users', 'firstName', {
          type: Sequelize.STRING,
          allowNull: false
        });
      }

      if (!columns.includes('lastName')) {
        await queryInterface.addColumn('Users', 'lastName', {
          type: Sequelize.STRING,
          allowNull: false
        });
      }

      if (!columns.includes('email')) {
        await queryInterface.addColumn('Users', 'email', {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        });
      }

      if (!columns.includes('password')) {
        await queryInterface.addColumn('Users', 'password', {
          type: Sequelize.STRING,
          allowNull: false
        });
      }

      if (!columns.includes('role')) {
        await queryInterface.addColumn('Users', 'role', {
          type: Sequelize.ENUM('user', 'admin'),
          defaultValue: 'user'
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Không làm gì trong down migration để tránh mất dữ liệu
  }
};
