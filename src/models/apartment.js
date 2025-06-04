'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Apartment extends Model {
        static associate(models) {
            Apartment.belongsTo(models.User, { foreignKey: 'id' });
            Apartment.hasMany(models.PhuongTien, {
                foreignKey: 'ApartmentID',
                sourceKey: 'ApartmentID'
            });
        }
    }

    Apartment.init({
        ApartmentID: {
            type: DataTypes.STRING(50),
            primaryKey: true,
            allowNull: false
        },
        Area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Diện tích m²'
        },
        SaleStatus: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['Đã bán', 'Chưa bán']]
            }
        },
        HouseNum: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        Floors: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BuildingName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        Tech_Status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['Bình thường', 'Bảo trì', 'Hỏng']]
            }
        },
        Use_Status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['Đang ở', 'Không ở']]
            }
        },
        id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Apartment',
        tableName: 'Canho',
        timestamps: false
    });

    return Apartment;
}; 