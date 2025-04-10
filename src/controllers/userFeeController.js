import db from '../models/index.js';

let getFeePage = async (req, res) => {
    try {
        let data = await db.Fee.findAll();
        return res.render("user-fee.ejs", {
            data: JSON.stringify(data)
        });
    } catch (e) {
        console.log(e);
    }
};

let payFee = async (req, res) => {
    try {
        let feeId = req.params.id;
        let fee = await db.Fee.findOne({ where: { id: feeId } });

        if (fee && fee.feeStatus === 'chưa thanh toán') {
            await db.Fee.update(
                { feeStatus: 'đã thanh toán', feeUpdatedAt: new Date() },
                { where: { id: feeId } }
            );
        }

        return res.redirect('/fee');
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi nộp phí.");
    }
};

export default {
    getFeePage,
    payFee
};
