require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
require("./database/db");

const productsRoute = require("./routes/products");
const authRoute = require("./routes/auth");
const settingsRoute = require("./routes/settings");
const analyticsRoute = require("./routes/analytics");

const app = express();

app.use(cors({
  origin: [
    "https://fkaimports.com.br",
    "https://www.fkaimports.com.br",
    "https://fka-frontend.pages.dev"
  ]
}));

app.use(express.json({ limit: "10mb" }));

app.use("/api/products", productsRoute);
app.use("/api/auth", authRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/analytics", analyticsRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});