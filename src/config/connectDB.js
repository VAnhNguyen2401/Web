const { Sequelize } = require('sequelize');

/**
 * Để kết nối với SQL Server, bạn cần cung cấp:
 * 1. Tên database: Quanli
 * 2. Username: thường là 'sa' hoặc một tài khoản đã được tạo
 * 3. Password: mật khẩu của tài khoản trên
 * 4. Host: DESKTOP-D7SSCQ5 (tên máy của bạn)
 */
const sequelize = new Sequelize('Quanli', 'sa', 'Vietanh24', {
    host: 'DESKTOP-D7SSCQ5',
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    }
});

let connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to SQL Server has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = connectDB;