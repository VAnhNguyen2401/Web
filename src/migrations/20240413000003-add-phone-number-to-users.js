'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'phoneNumber', {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                is: /^\+?[0-9]{10,15}$/ // Định dạng số điện thoại quốc tế
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'phoneNumber');
    }
}; 