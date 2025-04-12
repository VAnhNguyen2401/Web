'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Fees', 'lateFee', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        });

        await queryInterface.addColumn('Fees', 'isOverdue', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Fees', 'lateFee');
        await queryInterface.removeColumn('Fees', 'isOverdue');
    }
}; 