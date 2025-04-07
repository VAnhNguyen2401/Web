// If using CommonJS
let getHomePage = (req, res) => {
    return res.send("Hello world Vanh!");
}

module.exports = {
    getHomePage
};