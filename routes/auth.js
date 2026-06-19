const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database/db");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM admins WHERE username = $1",
            [username]
        );

        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: "Usuário inválido" });
        }

        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Senha inválida" });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;