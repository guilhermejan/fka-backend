const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// Opções do cookie centralizadas — usadas no login E no logout,
// pra garantir que res.clearCookie realmente sobrescreve/apaga o certo
const COOKIE_OPTS = {
    httpOnly: true,
    secure: true,
    sameSite: "none",           // ⬅ era "lax" — "none" é o correto pra fetch entre subdomínios
    domain: ".fkaimports.com.br", // ⬅ novo — deixa o cookie explícito pro site inteiro
    path: "/"
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true, // ⬅ novo — login certo não consome a cota
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
            { expiresIn: "24h", algorithm: "HS256" }
        );

        res.cookie("token", token, {
            ...COOKIE_OPTS,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ ok: true });

    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token", COOKIE_OPTS); // ⬅ agora usa as MESMAS opções do login
    res.json({ ok: true });
});

router.get("/me", authMiddleware, (req, res) => {
    res.json({ ok: true, username: req.admin.username });
});

module.exports = router;