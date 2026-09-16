// backend/database/db.js
const { Pool } = require("pg");

for (const name of ["DB_HOST", "DB_USER", "DB_PASSWORD"]) {
    if (!process.env[name]) throw new Error(`Configure ${name} no ambiente privado.`);
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

async function initDB() {
    const client = await pool.connect();
    try {
        // ── Tabelas base ──────────────────────────────────────────────
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
                id        SERIAL PRIMARY KEY,
                name      TEXT NOT NULL,
                location  TEXT,
                text      TEXT NOT NULL,
                stars     INTEGER DEFAULT 5,
                proof_img TEXT,
                active    INTEGER DEFAULT 1,
                position  INTEGER DEFAULT 0
            )
        `);

        // ── Migrations — corrige schema sem recriar tabelas ───────────
        //
        // Garante que colunas que podem ter sumido voltam a existir
        await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS position  INTEGER DEFAULT 0`);
        await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS proof_img TEXT`);
        await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS active    INTEGER DEFAULT 1`);

        // Se "active" foi acidentalmente alterado para BOOLEAN no Supabase,
        // converte de volta para INTEGER (1 = ativo, 0 = inativo)
        await client.query(`
            DO $$
            DECLARE col_type text;
            BEGIN
                SELECT data_type INTO col_type
                FROM information_schema.columns
                WHERE table_name  = 'reviews'
                  AND column_name = 'active'
                  AND table_schema = current_schema();

                IF col_type = 'boolean' THEN
                    ALTER TABLE reviews
                    ALTER COLUMN active TYPE INTEGER
                    USING CASE WHEN active THEN 1 ELSE 0 END;

                    RAISE NOTICE 'reviews.active convertido de boolean → integer';
                END IF;
            END $$;
        `);

        // Mesmo tratamento para products.active e products.featured
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS active   INTEGER DEFAULT 1`);
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured INTEGER DEFAULT 0`);

        await client.query(`
            DO $$
            DECLARE col_type text;
            BEGIN
                SELECT data_type INTO col_type
                FROM information_schema.columns
                WHERE table_name  = 'products'
                  AND column_name = 'active'
                  AND table_schema = current_schema();

                IF col_type = 'boolean' THEN
                    ALTER TABLE products
                    ALTER COLUMN active TYPE INTEGER
                    USING CASE WHEN active THEN 1 ELSE 0 END;
                END IF;
            END $$;
        `);

        console.log("✅ Banco inicializado e migrations aplicadas.");
    } catch (err) {
        console.error("❌ Erro ao inicializar banco:", err.message);
    } finally {
        client.release();
    }
}

initDB();
module.exports = pool;