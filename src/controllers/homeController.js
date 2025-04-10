let getHomePage = (req, res) => {
    return res.render("homepage.ejs");
};

let getAboutPage = (req, res) => {
    return res.send("Trang giới thiệu");
};

export default {
    getHomePage,
    getAboutPage
};
