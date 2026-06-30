const { Pool } = require("pg");

const pool = new Pool({
    host: "aws-1-sa-east-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.mmlbdvhprljjpygnqyjw",
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: true }
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id          SERIAL PRIMARY KEY,
                name        TEXT NOT NULL,
                cat         TEXT,
                price       NUMERIC,
                oldprice    NUMERIC,
                description TEXT,
                active      INTEGER DEFAULT 1,
                img         TEXT,
                badge       TEXT,
                featured    INTEGER DEFAULT 0
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id       SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id          SERIAL PRIMARY KEY,
                name        TEXT NOT NULL,
                location    TEXT,
                text        TEXT NOT NULL,
                stars       INTEGER DEFAULT 5,
                proof_img   TEXT,
                active      INTEGER DEFAULT 1,
                position    INTEGER DEFAULT 0
            )
        `);

        console.log("Banco inicializado.");
    } catch (err) {
        console.error("Erro ao inicializar banco:", err.message);
    } finally {
        client.release();
    }
}

initDB();
module.exports = pool;