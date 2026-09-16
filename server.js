require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("./database/db");

const productsRoute = require("./routes/products");
const authRoute = require("./routes/auth");
const settingsRoute = require("./routes/settings");
const analyticsRoute = require("./routes/analytics");
const reviewsRoute = require("./routes/reviews");
const uploadRoute = require("./routes/upload");

const app = express();

app.use(helmet({
    contentSecurityPolicy: false
}));


app.use(cors({
    origin: (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
    credentials: true
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em alguns minutos." }
});
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/products", productsRoute);
app.use("/api/auth", authRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/upload", uploadRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});