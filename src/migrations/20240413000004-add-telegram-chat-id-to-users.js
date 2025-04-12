'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'telegramChatId', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'phoneNumber'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'telegramChatId');
    }
}; 