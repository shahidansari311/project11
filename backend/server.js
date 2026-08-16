const app = require("./src/app");
const dotenv = require("dotenv");
const prisma = require("./src/config/db");
dotenv.config();
const port = process.env.PORT || 4000;

app.listen(port, '0.0.0.0', async () => {
    console.log(`Server started on port ${port}`);
    
    try {
        await prisma.$connect();
        console.log("✅ Database connected successfully.");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
});