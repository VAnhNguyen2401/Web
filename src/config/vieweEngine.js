import express from "express";


let configViewEngine =(app) =>{
    app.use(express.static("./src/public"));
    app.set("view engine", "ejs");
    app.set("views", "./src/views");
    console.log("View engine configured successfully");
    

}

module.exports = configViewEngine;
