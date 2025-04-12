import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoute from "./route/web";
import connectDB from "./config/connectDB";
import session from "express-session";
require('dotenv').config();

// Import Telegram service
require('./services/telegramService');

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set true nếu dùng HTTPS
}));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

viewEngine(app);
initWebRoute(app);
connectDB();

let port = process.env.PORT || 6969;
//Port == undefined => port = 6969

app.listen(port, () => {
    console.log("Backend Nodejs is running on the port: " + port);
})