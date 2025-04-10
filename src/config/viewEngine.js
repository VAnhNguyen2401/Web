import express from 'express';
import path from 'path';

const configViewEngine = (app) => {
    app.use(express.static(path.join('./src/public'))); // nếu có dùng static
    app.set('view engine', 'ejs');
    app.set('views', path.join('./src/views')); // Đảm bảo đúng thư mục
};

export default configViewEngine;
