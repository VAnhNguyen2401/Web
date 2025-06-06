import db from "../models";

// Hiển thị trang quản lý phương tiện
let getVehicleManagePage = async (req, res) => {
    try {
        console.log("=== Loading Vehicle Management Page ===");

        // Dữ liệu mặc định
        let vehicles = [];
        let users = [];
        let apartments = [];
        let stats = {
            totalVehicles: 0,
            motorcycles: 0,
            cars: 0,
            bicycles: 0,
            electricVehicles: 0,
            activeVehicles: 0,
            pausedVehicles: 0
        };

        // Lấy users có căn hộ
        try {
            users = await db.sequelize.query(
                `SELECT u.id, u.firstName, u.lastName, u.email, c.ApartmentID
                 FROM Users u 
                 INNER JOIN Canho c ON u.id = c.id 
                 WHERE u.role = 'user'
                 ORDER BY u.firstName`,
                { type: db.sequelize.QueryTypes.SELECT }
            );
            console.log(`Found ${users.length} users with apartments`);
        } catch (e) {
            console.log("Error getting users:", e.message);
        }

        // Lấy danh sách căn hộ
        try {
            apartments = await db.sequelize.query(
                `SELECT ApartmentID, Area, Use_Status FROM Canho ORDER BY ApartmentID`,
                { type: db.sequelize.QueryTypes.SELECT }
            );
            console.log(`Found ${apartments.length} apartments`);
        } catch (e) {
            console.log("Error getting apartments:", e.message);
        }

        // Lấy phương tiện (bao gồm cả Brand và ApartmentID)
        try {
            vehicles = await db.sequelize.query(
                `SELECT p.VehicleID, p.VehicleType, p.LicensePlate, p.Brand, p.id, p.ApartmentID,
                        u.firstName, u.lastName, u.email
                 FROM PhuongTien p
                 LEFT JOIN Users u ON p.id = u.id
                 ORDER BY p.VehicleID`,
                { type: db.sequelize.QueryTypes.SELECT }
            );

            // Thêm thông tin mặc định
            vehicles = vehicles.map(v => ({
                VehicleID: v.VehicleID,
                LicensePlate: v.LicensePlate,
                VehicleType: v.VehicleType,
                Brand: v.Brand || 'Chưa xác định',
                id: v.id,
                ApartmentID: v.ApartmentID || '',
                Model: '',
                Color: '',
                RegisterDate: new Date(),
                Status: 'Hoạt động',
                Notes: '',
                firstName: v.firstName || 'Chưa gán',
                lastName: v.lastName || '',
                email: v.email || ''
            }));

            // Thống kê
            const total = vehicles.length;
            const motorcycles = vehicles.filter(v => v.VehicleType.includes('máy')).length;
            const cars = vehicles.filter(v => v.VehicleType.includes('tô')).length;
            const bicycles = vehicles.filter(v => v.VehicleType.includes('đạp')).length;
            const electric = vehicles.filter(v => v.VehicleType.includes('điện')).length;

            stats = {
                totalVehicles: total,
                motorcycles: motorcycles,
                cars: cars,
                bicycles: bicycles,
                electricVehicles: electric,
                activeVehicles: total,
                pausedVehicles: 0
            };

            console.log(`Found ${vehicles.length} vehicles`);
        } catch (e) {
            console.log("Error getting vehicles:", e.message);
        }

        return res.render("admin/vehicle-management.ejs", {
            vehicles: vehicles,
            users: users,
            apartments: apartments,
            stats: stats
        });

    } catch (e) {
        console.error("Error in getVehicleManagePage:", e);
        return res.render("admin/vehicle-management.ejs", {
            vehicles: [],
            users: [],
            apartments: [],
            stats: {
                totalVehicles: 0,
                motorcycles: 0,
                cars: 0,
                bicycles: 0,
                electricVehicles: 0,
                activeVehicles: 0,
                pausedVehicles: 0
            }
        });
    }
}

// Thêm phương tiện mới
let createVehicle = async (req, res) => {
    try {
        const { licensePlate, vehicleType, brand, apartmentId, id } = req.body;

        if (!licensePlate || !vehicleType) {
            return res.status(400).send("Vui lòng nhập biển số và loại xe");
        }

        // Tạo ID mới
        const result = await db.sequelize.query(
            "SELECT ISNULL(MAX(CAST(VehicleID AS INT)), 0) + 1 as nextId FROM PhuongTien",
            { type: db.sequelize.QueryTypes.SELECT }
        );
        const newId = result[0].nextId.toString();

        // Kiểm tra trùng biển số
        const existing = await db.sequelize.query(
            "SELECT VehicleID FROM PhuongTien WHERE LicensePlate = :plate",
            {
                replacements: { plate: licensePlate },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (existing.length > 0) {
            return res.status(400).send("Biển số đã tồn tại");
        }

        // Thêm mới (bao gồm Brand, ApartmentID và id)
        await db.sequelize.query(
            "INSERT INTO PhuongTien (VehicleID, VehicleType, LicensePlate, Brand, ApartmentID, id) VALUES (:id, :type, :plate, :brand, :apartmentId, :userId)",
            {
                replacements: {
                    id: newId,
                    type: vehicleType,
                    plate: licensePlate,
                    brand: brand || 'Chưa xác định',
                    apartmentId: apartmentId || null,
                    userId: id || null
                },
                type: db.sequelize.QueryTypes.INSERT
            }
        );

        console.log(`Created vehicle ${newId}: ${licensePlate} - ${brand} - Apartment: ${apartmentId} - User: ${id}`);
        return res.redirect('/admin/vehicle');

    } catch (e) {
        console.error("Error creating vehicle:", e);
        return res.status(500).send("Lỗi: " + e.message);
    }
}

// Cập nhật phương tiện
let updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { licensePlate, vehicleType, brand, apartmentId, id: userId } = req.body;

        await db.sequelize.query(
            "UPDATE PhuongTien SET VehicleType = :type, LicensePlate = :plate, Brand = :brand, ApartmentID = :apartmentId, id = :userId WHERE VehicleID = :id",
            {
                replacements: {
                    type: vehicleType,
                    plate: licensePlate,
                    brand: brand || 'Chưa xác định',
                    apartmentId: apartmentId || null,
                    userId: userId || null,
                    id: id
                },
                type: db.sequelize.QueryTypes.UPDATE
            }
        );

        return res.json({ message: "Cập nhật thành công" });

    } catch (e) {
        console.error("Error updating vehicle:", e);
        return res.status(500).json({ error: e.message });
    }
}

// Xóa phương tiện
let deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        await db.sequelize.query(
            "DELETE FROM PhuongTien WHERE VehicleID = :id",
            {
                replacements: { id: id },
                type: db.sequelize.QueryTypes.DELETE
            }
        );

        return res.json({ message: "Xóa thành công" });

    } catch (e) {
        console.error("Error deleting vehicle:", e);
        return res.status(500).json({ error: e.message });
    }
}

module.exports = {
    getVehicleManagePage,
    createVehicle,
    updateVehicle,
    deleteVehicle
}; 