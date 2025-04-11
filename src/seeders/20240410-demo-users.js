'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const hashedUserPassword = await bcrypt.hash('user123', 10);

        await queryInterface.bulkInsert('Users', [
            {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: hashedAdminPassword,
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Normal',
                lastName: 'User',
                email: 'user@example.com',
                password: hashedUserPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Users', null, {});
    }
}; 