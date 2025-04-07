// web.js
import express from "express";
import homeController from "../controllers/homeController.js"; // nhớ thêm .js nếu dùng "type": "module"

let router = express.Router();

let initWebRoute = (app) => {
    router.get('/', homeController.getHomePage);

    router.get('/about', homeController.getAboutPage);

    app.use("/", router);
}

export default initWebRoute; // ✅ Dùng export ES6 đúng cách
