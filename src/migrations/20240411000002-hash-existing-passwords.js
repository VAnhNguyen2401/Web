'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Get all users
            const users = await queryInterface.sequelize.query(
                'SELECT id, password FROM Users',
                { type: Sequelize.QueryTypes.SELECT }
            );

            // Update each user's password if it's not already hashed
            for (const user of users) {
                // Check if password is not already hashed (bcrypt hashes start with '$2')
                if (!user.password.startsWith('$2')) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(user.password, salt);

                    await queryInterface.sequelize.query(
                        'UPDATE Users SET password = ? WHERE id = ?',
                        {
                            replacements: [hashedPassword, user.id],
                            type: Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Cannot safely revert password hashing
        console.log('This migration cannot be reverted');
    }
}; 