'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Kiểm tra xem bảng Users có tồn tại không
        const tableExists = await queryInterface.describeTable('Users');

        if (tableExists) {
            // Kiểm tra xem các cột đã tồn tại chưa
            const columns = Object.keys(tableExists);

            if (!columns.includes('resetPasswordToken')) {
                await queryInterface.addColumn('Users', 'resetPasswordToken', {
                    type: Sequelize.STRING,
                    allowNull: true
                });
            }

            if (!columns.includes('resetPasswordExpires')) {
                await queryInterface.addColumn('Users', 'resetPasswordExpires', {
                    type: Sequelize.BIGINT,
                    allowNull: true
                });
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tableExists = await queryInterface.describeTable('Users');

        if (tableExists) {
            const columns = Object.keys(tableExists);

            if (columns.includes('resetPasswordToken')) {
                await queryInterface.removeColumn('Users', 'resetPasswordToken');
            }

            if (columns.includes('resetPasswordExpires')) {
                await queryInterface.removeColumn('Users', 'resetPasswordExpires');
            }
        }
    }
}; 