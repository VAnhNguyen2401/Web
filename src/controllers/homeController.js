// If using CommonJS
let getHomePage = (req, res) => {
    return res.render("homepage.ejs");
}

let getAboutPage = (req, res) => {
    return res.render("about.ejs");
}

module.exports = {
    getHomePage,
    getAboutPage

};