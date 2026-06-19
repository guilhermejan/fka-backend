require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcrypt");
const pool = require("./database/db");

async function createAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.error("Defina ADMIN_USERNAME e ADMIN_PASSWORD no .env antes de rodar este script.");
        process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);

    try {
        await pool.query(
            "INSERT INTO admins (username, password) VALUES ($1, $2)",
            [username, hash]
        );
        console.log("Admin criado com sucesso! Remova ADMIN_USERNAME e ADMIN_PASSWORD do .env agora.");
    } catch (err) {
        if (err.message.includes("unique") || err.message.includes("duplicate")) {
            console.error("Usuário já existe. Para trocar a senha, use o script updateAdminPassword.js");
        } else {
            console.error("Erro:", err.message);
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

createAdmin();