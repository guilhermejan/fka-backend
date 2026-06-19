require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcrypt");
const pool = require("./database/db");

async function updateAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.error("Defina ADMIN_USERNAME e ADMIN_PASSWORD no .env antes de rodar este script.");
        process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            "UPDATE admins SET password=$1 WHERE username=$2",
            [hash, username]
        );
        if (result.rowCount === 0) {
            console.error("Usuário não encontrado. Use createAdmin.js para criar.");
        } else {
            console.log("Senha atualizada com sucesso! Remova ADMIN_USERNAME e ADMIN_PASSWORD do .env.");
        }
    } catch (err) {
        console.error("Erro:", err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateAdmin();