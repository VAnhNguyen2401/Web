// web.js
import express from "express";
import homeController from "../controllers/homeController.js"; // nhớ thêm .js nếu dùng "type": "module"
import userFeeController from "../controllers/userFeeController.js"; // nhớ thêm .js nếu dùng "type": "module"

let router = express.Router();

let initWebRoute = (app) => {
    router.get('/', homeController.getHomePage);

    router.get('/about', homeController.getAboutPage);
    router.get('/', homeController.getHomePage);
    router.get('/fee', userFeeController.getFeePage);
    router.get('/pay/:id', userFeeController.payFee);



    app.use("/", router);
}

export default initWebRoute; // ✅ Dùng export ES6 đúng cách
