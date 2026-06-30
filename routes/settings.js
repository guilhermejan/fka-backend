const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

const ALL_VALID_KEYS = [
    "hero_bg",
    "hero_bg_desktop",
    "hero_bg_mobile"
];

const PUBLIC_KEYS = ["hero_bg", "hero_bg_desktop", "hero_bg_mobile"];

router.get("/:key", async (req, res) => {
    const { key } = req.params;

    if (!ALL_VALID_KEYS.includes(key)) {
        return res.status(404).json({ error: "Configuração não encontrada" });
    }

    const isPublic = PUBLIC_KEYS.includes(key);

    if (!isPublic) {
        return authMiddleware(req, res, async () => {
            try {
                const result = await pool.query(
                    "SELECT value FROM settings WHERE key = $1",
                    [key]
                );
                res.json({ value: result.rows[0]?.value || "" });
            } catch (err) {
                console.error("Erro ao buscar setting:", err.message);
                res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
            }
        });
    }

    try {
        const result = await pool.query(
            "SELECT value FROM settings WHERE key = $1",
            [key]
        );
        res.json({ value: result.rows[0]?.value || "" });
    } catch (err) {
        console.error("Erro ao buscar setting:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.put("/:key", authMiddleware, async (req, res) => {
    const { key } = req.params;

    if (!ALL_VALID_KEYS.includes(key)) {
        return res.status(400).json({ error: "Chave inválida" });
    }

    const { value } = req.body;

    try {
        await pool.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2`,
            [key, value]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Erro ao salvar setting:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

module.exports = router;