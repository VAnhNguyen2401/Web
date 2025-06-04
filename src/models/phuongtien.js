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
        ApartmentID: {
            type: DataTypes.STRING(10),
            allowNull: false,
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

    PhuongTien.associate = function (models) {
        PhuongTien.belongsTo(models.Apartment, {
            foreignKey: 'ApartmentID',
            targetKey: 'ApartmentID'
        });
    };

    return PhuongTien;
};
