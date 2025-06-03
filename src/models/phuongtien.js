'use strict';

module.exports = (sequelize, DataTypes) => {
    const PhuongTien = sequelize.define('PhuongTien', {
        VehicleID: {
            type: DataTypes.STRING(50),
            primaryKey: true,
            allowNull: false
        },
        VehicleType: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        LicensePlate: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        Brand: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: 'Chưa xác định'
        },
        UserID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        ApartmentID: {
            type: DataTypes.STRING(10),
            allowNull: true,
            references: {
                model: 'Canho',
                key: 'ApartmentID'
            }
        }
    }, {
        tableName: 'PhuongTien',
        timestamps: false,
        freezeTableName: true
    });

    return PhuongTien;
};
