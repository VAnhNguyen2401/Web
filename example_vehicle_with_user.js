// Ví dụ: Lấy thông tin phương tiện kèm thông tin chủ sở hữu thông qua apartment

const getVehiclesWithOwners = async () => {
    try {
        const vehicles = await db.PhuongTien.findAll({
            include: [
                {
                    model: db.Apartment,
                    attributes: ['ApartmentID', 'HouseNum', 'Floors', 'BuildingName'],
                    include: [
                        {
                            model: db.User,
                            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
                        }
                    ]
                }
            ]
        });

        return vehicles;
    } catch (error) {
        console.error('Error fetching vehicles with owners:', error);
        throw error;
    }
};

// Ví dụ: Lấy tất cả phương tiện của một user
const getVehiclesByUser = async (userId) => {
    try {
        const userVehicles = await db.User.findByPk(userId, {
            include: [
                {
                    model: db.Apartment,
                    include: [
                        {
                            model: db.PhuongTien,
                            attributes: ['VehicleID', 'VehicleType', 'LicensePlate', 'Brand']
                        }
                    ]
                }
            ]
        });

        return userVehicles;
    } catch (error) {
        console.error('Error fetching user vehicles:', error);
        throw error;
    }
};

// Ví dụ: Lấy phương tiện theo tòa nhà
const getVehiclesByBuilding = async (buildingName) => {
    try {
        const vehicles = await db.PhuongTien.findAll({
            include: [
                {
                    model: db.Apartment,
                    where: { BuildingName: buildingName },
                    include: [
                        {
                            model: db.User,
                            attributes: ['firstName', 'lastName', 'phoneNumber']
                        }
                    ]
                }
            ]
        });

        return vehicles;
    } catch (error) {
        console.error('Error fetching vehicles by building:', error);
        throw error;
    }
};

module.exports = {
    getVehiclesWithOwners,
    getVehiclesByUser,
    getVehiclesByBuilding
}; 