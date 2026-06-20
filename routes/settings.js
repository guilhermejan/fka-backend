// routes/settings.js — substitui o arquivo vazio atual
const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/settings/:key
router.get("/:key", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT value FROM settings WHERE key = $1",
            [req.params.key]
        );
        res.json({ value: result.rows[0]?.value || "" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/settings/:key
router.put("/:key", authMiddleware, async (req, res) => {
    const { value } = req.body;
    try {
        await pool.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2`,
            [req.params.key, value]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;