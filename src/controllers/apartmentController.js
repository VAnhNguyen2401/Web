const db = require('../models');

// Hiển thị trang quản lý căn hộ
let getApartmentManagePage = async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/login');
        }

        // Lấy danh sách TẤT CẢ căn hộ Blue Moon (có và chưa có chủ sở hữu)
        const apartments = await db.sequelize.query(
            `SELECT 
                c.ApartmentID, 
                c.Area, 
                c.SaleStatus, 
                c.HouseNum, 
                c.Floors, 
                c.BuildingName, 
                c.Tech_Status, 
                c.Use_Status,
                u.firstName + ' ' + u.lastName as OwnerName,
                u.email as OwnerEmail,
                u.phoneNumber as OwnerPhone,
                c.id as OwnerID,
                CASE 
                    WHEN RIGHT(c.HouseNum, 2) IN ('01', '10') THEN N'Căn góc'
                    WHEN RIGHT(c.HouseNum, 2) IN ('05', '06') THEN N'Căn giữa'
                    ELSE N'Căn thường'
                END as ApartmentType,
                CASE 
                    WHEN c.Floors <= 5 THEN N'Tầng thấp'
                    WHEN c.Floors <= 25 THEN N'Tầng trung'
                    WHEN c.Floors <= 40 THEN N'Tầng cao'
                    ELSE N'Tầng cao cấp'
                END as FloorCategory,
                CASE 
                    WHEN c.id IS NOT NULL THEN N'Đã có chủ'
                    ELSE N'Trống'
                END as OwnershipStatus
             FROM Canho c
             LEFT JOIN Users u ON c.id = u.id
             WHERE c.BuildingName = N'Blue Moon'
             ORDER BY c.Floors, c.HouseNum`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        // Lấy danh sách users chưa có căn hộ (trừ admin) - cho việc gán căn hộ
        const availableUsers = await db.sequelize.query(
            `SELECT u.id, u.firstName, u.lastName, u.email 
             FROM Users u 
             LEFT JOIN Canho c ON u.id = c.id 
             WHERE c.id IS NULL AND u.role = 'user'
             ORDER BY u.firstName, u.lastName`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        // Thống kê tổng quan cho Blue Moon
        const stats = await db.sequelize.query(
            `SELECT 
                COUNT(*) as totalApartments,
                SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END) as ownedApartments,
                SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END) as availableApartments,
                SUM(CASE WHEN Use_Status = N'Đang ở' THEN 1 ELSE 0 END) as occupiedApartments,
                SUM(CASE WHEN RIGHT(HouseNum, 2) IN ('01', '10') THEN 1 ELSE 0 END) as totalCornerApartments,
                SUM(CASE WHEN RIGHT(HouseNum, 2) IN ('05', '06') THEN 1 ELSE 0 END) as totalMiddleApartments,
                AVG(Area) as avgArea,
                MIN(Area) as minArea,
                MAX(Area) as maxArea
             FROM Canho c
             WHERE c.BuildingName = N'Blue Moon'`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        return res.render("admin-apartment.ejs", {
            apartments: apartments,
            availableUsers: availableUsers,
            stats: stats[0] || {}
        });
    } catch (error) {
        console.error('Error fetching apartments:', error);
        return res.status(500).send("Có lỗi xảy ra khi tải dữ liệu căn hộ.");
    }
};

// Tạo căn hộ mới
let createApartment = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send("Không có quyền truy cập");
        }

        const {
            apartmentID,
            area,
            saleStatus,
            floors,
            roomNumber,
            buildingName,
            techStatus,
            useStatus,
            ownerId
        } = req.body;

        // Validate dữ liệu Blue Moon
        if (!floors || !roomNumber || !area) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin bắt buộc cho tòa Blue Moon");
        }

        // Validate Blue Moon constraints
        const floorNum = parseInt(floors);
        const roomNum = parseInt(roomNumber);

        if (floorNum < 1 || floorNum > 50) {
            return res.status(400).send("Tầng phải từ 1 đến 50");
        }

        if (roomNum < 1 || roomNum > 10) {
            return res.status(400).send("Phòng phải từ 1 đến 10");
        }

        // Tạo mã căn hộ và số nhà theo format Blue Moon
        const generatedApartmentID = `BM-T${floorNum.toString().padStart(2, '0')}-P${roomNum.toString().padStart(2, '0')}`;
        const houseNum = `${floorNum.toString().padStart(2, '0')}${roomNum.toString().padStart(2, '0')}`;

        // Kiểm tra xem căn hộ đã tồn tại chưa
        const existingApartment = await db.sequelize.query(
            `SELECT ApartmentID FROM Canho WHERE ApartmentID = :apartmentID OR (Floors = :floors AND HouseNum = :houseNum AND BuildingName = N'Blue Moon')`,
            {
                replacements: {
                    apartmentID: generatedApartmentID,
                    floors: floorNum,
                    houseNum: houseNum
                },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (existingApartment.length > 0) {
            return res.status(400).send(`Căn hộ tầng ${floorNum}, phòng ${roomNum} đã tồn tại`);
        }

        // Nếu có chọn chủ sở hữu, kiểm tra user đã có căn hộ chưa
        if (ownerId) {
            const userApartment = await db.sequelize.query(
                `SELECT ApartmentID FROM Canho WHERE id = :ownerId`,
                {
                    replacements: { ownerId: ownerId },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            if (userApartment.length > 0) {
                return res.status(400).send("User này đã sở hữu căn hộ khác. Mỗi user chỉ được sở hữu 1 căn hộ.");
            }
        }

        // Tạo căn hộ mới
        await db.sequelize.query(
            `INSERT INTO Canho (
                ApartmentID, Area, SaleStatus, HouseNum, Floors, 
                BuildingName, Tech_Status, Use_Status, id
            ) VALUES (
                :apartmentID, :area, :saleStatus, :houseNum, :floors,
                :buildingName, :techStatus, :useStatus, :ownerId
            )`,
            {
                replacements: {
                    apartmentID: generatedApartmentID,
                    area: parseFloat(area),
                    saleStatus: 'Chưa bán',
                    houseNum: houseNum,
                    floors: floorNum,
                    buildingName: 'Blue Moon',
                    techStatus: 'Bình thường',
                    useStatus: useStatus || 'Không ở',
                    ownerId: ownerId || null
                },
                type: db.sequelize.QueryTypes.INSERT
            }
        );

        return res.redirect('/admin/apartment');
    } catch (error) {
        console.error('Error creating apartment:', error);
        return res.status(500).send("Có lỗi xảy ra khi tạo căn hộ: " + error.message);
    }
};

// Cập nhật thông tin căn hộ
let updateApartment = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send("Không có quyền truy cập");
        }

        const apartmentID = req.params.id;
        const {
            area,
            saleStatus,
            houseNum,
            floors,
            buildingName,
            techStatus,
            useStatus,
            ownerId
        } = req.body;

        // Nếu có thay đổi chủ sở hữu, kiểm tra user mới đã có căn hộ chưa
        if (ownerId) {
            const userApartment = await db.sequelize.query(
                `SELECT ApartmentID FROM Canho WHERE id = :ownerId AND ApartmentID != :apartmentID`,
                {
                    replacements: { ownerId: ownerId, apartmentID: apartmentID },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            if (userApartment.length > 0) {
                return res.status(400).json({
                    error: "User này đã sở hữu căn hộ khác. Mỗi user chỉ được sở hữu 1 căn hộ."
                });
            }
        }

        await db.sequelize.query(
            `UPDATE Canho SET 
                Area = :area,
                SaleStatus = :saleStatus,
                HouseNum = :houseNum,
                Floors = :floors,
                BuildingName = :buildingName,
                Tech_Status = :techStatus,
                Use_Status = :useStatus,
                id = :ownerId
             WHERE ApartmentID = :apartmentID`,
            {
                replacements: {
                    area: parseFloat(area),
                    saleStatus: saleStatus,
                    houseNum: houseNum,
                    floors: parseInt(floors),
                    buildingName: buildingName,
                    techStatus: techStatus,
                    useStatus: useStatus,
                    ownerId: ownerId || null,
                    apartmentID: apartmentID
                },
                type: db.sequelize.QueryTypes.UPDATE
            }
        );

        return res.status(200).json({ message: "Cập nhật căn hộ thành công" });
    } catch (error) {
        console.error('Error updating apartment:', error);
        return res.status(500).send("Có lỗi xảy ra khi cập nhật căn hộ.");
    }
};

// Xóa căn hộ
let deleteApartment = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send("Không có quyền truy cập");
        }

        const apartmentID = req.params.id;

        await db.sequelize.query(
            `DELETE FROM Canho WHERE ApartmentID = :apartmentID`,
            {
                replacements: { apartmentID: apartmentID },
                type: db.sequelize.QueryTypes.DELETE
            }
        );

        return res.status(200).json({ message: "Xóa căn hộ thành công" });
    } catch (error) {
        console.error('Error deleting apartment:', error);
        return res.status(500).send("Có lỗi xảy ra khi xóa căn hộ.");
    }
};

// Gán căn hộ cho user
let assignApartment = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: "Không có quyền truy cập" });
        }

        const { apartmentID, ownerId } = req.body;

        if (!apartmentID || !ownerId) {
            return res.status(400).json({ error: "Thiếu thông tin apartmentID hoặc ownerId" });
        }

        // Kiểm tra căn hộ có tồn tại và chưa có chủ không
        const apartment = await db.sequelize.query(
            `SELECT ApartmentID, id as currentOwner FROM Canho WHERE ApartmentID = :apartmentID`,
            {
                replacements: { apartmentID: apartmentID },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (apartment.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy căn hộ" });
        }

        if (apartment[0].currentOwner) {
            return res.status(400).json({ error: "Căn hộ đã có chủ sở hữu" });
        }

        // Kiểm tra user có tồn tại và chưa có căn hộ không
        const userCheck = await db.sequelize.query(
            `SELECT u.id, u.firstName, u.lastName, c.ApartmentID as existingApartment
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             WHERE u.id = :ownerId`,
            {
                replacements: { ownerId: ownerId },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy user" });
        }

        if (userCheck[0].existingApartment) {
            return res.status(400).json({
                error: `User đã sở hữu căn hộ ${userCheck[0].existingApartment}. Mỗi user chỉ được sở hữu 1 căn hộ.`
            });
        }

        // Gán căn hộ cho user
        await db.sequelize.query(
            `UPDATE Canho SET id = :ownerId WHERE ApartmentID = :apartmentID`,
            {
                replacements: {
                    ownerId: ownerId,
                    apartmentID: apartmentID
                },
                type: db.sequelize.QueryTypes.UPDATE
            }
        );

        return res.status(200).json({
            message: `Đã gán căn hộ ${apartmentID} cho ${userCheck[0].firstName} ${userCheck[0].lastName} thành công!`
        });

    } catch (error) {
        console.error('Error assigning apartment:', error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi gán căn hộ: " + error.message });
    }
};

// Hủy quyền sở hữu căn hộ
let removeOwner = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: "Không có quyền truy cập" });
        }

        const { apartmentID } = req.body;

        if (!apartmentID) {
            return res.status(400).json({ error: "Thiếu thông tin apartmentID" });
        }

        // Kiểm tra căn hộ có tồn tại và có chủ không
        const apartment = await db.sequelize.query(
            `SELECT c.ApartmentID, c.id as currentOwner, u.firstName + ' ' + u.lastName as ownerName
             FROM Canho c
             LEFT JOIN Users u ON c.id = u.id
             WHERE c.ApartmentID = :apartmentID`,
            {
                replacements: { apartmentID: apartmentID },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (apartment.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy căn hộ" });
        }

        if (!apartment[0].currentOwner) {
            return res.status(400).json({ error: "Căn hộ chưa có chủ sở hữu" });
        }

        // Hủy quyền sở hữu căn hộ
        await db.sequelize.query(
            `UPDATE Canho SET id = NULL WHERE ApartmentID = :apartmentID`,
            {
                replacements: { apartmentID: apartmentID },
                type: db.sequelize.QueryTypes.UPDATE
            }
        );

        return res.status(200).json({
            message: `Đã hủy quyền sở hữu căn hộ ${apartmentID} của ${apartment[0].ownerName}. Căn hộ hiện đã trống.`
        });

    } catch (error) {
        console.error('Error removing apartment owner:', error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi hủy quyền sở hữu: " + error.message });
    }
};

module.exports = {
    getApartmentManagePage,
    createApartment,
    updateApartment,
    deleteApartment,
    assignApartment,
    removeOwner
}; 