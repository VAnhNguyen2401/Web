'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Fees', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            feeType: {
                type: Sequelize.STRING,
                allowNull: false
            },
            feeAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            feeDescription: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            feeDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            feeStatus: {
                type: Sequelize.ENUM('chưa thanh toán', 'đã thanh toán'),
                allowNull: false,
                defaultValue: 'chưa thanh toán'
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            feeCreatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            feeUpdatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            feeDeletedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            feeCreatedBy: {
                type: Sequelize.STRING,
                allowNull: false
            },
            feeUpdatedBy: {
                type: Sequelize.STRING,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Fees');
    }
}; 