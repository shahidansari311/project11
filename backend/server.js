const app = require("./src/app");
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 4000;

app.listen(port,'0.0.0.0' ,() => {
    console.log(`Server started on port ${port}`);
});