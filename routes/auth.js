const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../database/db");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM admins WHERE username = $1",
            [username]
        );

        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: "Usuário ou senha inválidos" });
        }

        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Usuário ou senha inválidos" });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token });

    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

module.exports = router;