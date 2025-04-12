'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Fees', 'deadline', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('DATE_ADD(NOW(), INTERVAL 15 DAY)')
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Fees', 'deadline');
    }
}; 