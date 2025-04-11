'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Lấy user đầu tiên để thêm dữ liệu mẫu
        const users = await queryInterface.sequelize.query(
            'SELECT id FROM Users WHERE role = "user" LIMIT 1',
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length === 0) {
            console.log('Không tìm thấy user để thêm dữ liệu mẫu');
            return;
        }

        const userId = users[0].id;
        const now = new Date();

        // Tạo dữ liệu mẫu cho 6 tháng
        const sampleFees = [];
        const feeTypes = ['Phí quản lý', 'Phí gửi xe', 'Phí điện', 'Phí nước', 'Phí internet', 'Phí vệ sinh'];

        for (let i = 0; i < 6; i++) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = month.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            // Thêm 3-5 khoản phí cho mỗi tháng
            const numFees = Math.floor(Math.random() * 3) + 3; // Random 3-5 khoản

            for (let j = 0; j < numFees; j++) {
                const amount = Math.floor(Math.random() * 1000000) + 500000; // Random 500,000 - 1,500,000 VND
                const status = Math.random() > 0.3 ? 'đã thanh toán' : 'chưa thanh toán'; // 70% đã thanh toán

                sampleFees.push({
                    feeType: feeTypes[Math.floor(Math.random() * feeTypes.length)],
                    feeAmount: amount,
                    feeDescription: `Phí tháng ${month.getMonth() + 1}/${month.getFullYear()}`,
                    feeDate: monthStr,
                    feeStatus: status,
                    userId: userId,
                    feeCreatedAt: new Date(),
                    feeUpdatedAt: new Date(),
                    feeCreatedBy: 'system',
                    feeUpdatedBy: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Log dữ liệu mẫu để debug
        console.log('Sample Fees:', sampleFees);

        await queryInterface.bulkInsert('Fees', sampleFees, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Fees', null, {});
    }
}; 