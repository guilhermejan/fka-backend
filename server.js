require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

require("./database/db");

const productsRoute = require("./routes/products");
const authRoute = require("./routes/auth");

const app = express();

// Em produção, troque "*" pela URL real do GitHub Pages
// ex: "https://seuusuario.github.io"
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/products", productsRoute);
app.use("/api/auth", authRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});