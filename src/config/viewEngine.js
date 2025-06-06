import express from 'express';
import path from 'path';

const configViewEngine = (app) => {
    app.use(express.static(path.join('./src/public')));
    app.use('/style', express.static(path.join('./src/views/style')));
    app.set('view engine', 'ejs');
    app.set('views', path.join('./src/views'));
};

export default configViewEngine;
