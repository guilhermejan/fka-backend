// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

// ── GET público — só reviews ativas ──────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, location, text, stars, proof_img, active
            FROM reviews
            WHERE active::integer = 1
            ORDER BY COALESCE(position, 0) ASC, id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar avaliações:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

// ── GET admin — todas as reviews ─────────────────────────────────────
router.get("/admin", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, location, text, stars, proof_img,
                   active::integer AS active,
                   COALESCE(position, 0) AS position
            FROM reviews
            ORDER BY COALESCE(position, 0) ASC, id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar avaliações (admin):", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

// ── POST — criar review ───────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
    const { name, location, text, stars, proof_img, active, position } = req.body;

    if (!name || !text) {
        return res.status(400).json({ error: "Nome e texto são obrigatórios" });
    }

    const starsVal    = Math.min(5, Math.max(1, parseInt(stars) || 5));
    const activeVal   = active ? 1 : 0;          // sempre salva como 0 ou 1
    const positionVal = parseInt(position) || 0;

    try {
        const result = await pool.query(
            `INSERT INTO reviews (name, location, text, stars, proof_img, active, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [name, location || null, text, starsVal, proof_img || null, activeVal, positionVal]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error("Erro ao criar avaliação:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

// ── PUT — atualizar review ────────────────────────────────────────────
router.put("/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { name, location, text, stars, proof_img, active, position } = req.body;

    if (!name || !text) {
        return res.status(400).json({ error: "Nome e texto são obrigatórios" });
    }

    const starsVal    = Math.min(5, Math.max(1, parseInt(stars) || 5));
    const activeVal   = active ? 1 : 0;
    const positionVal = parseInt(position) || 0;

    try {
        const result = await pool.query(
            `UPDATE reviews
             SET name=$1, location=$2, text=$3, stars=$4,
                 proof_img=$5, active=$6, position=$7
             WHERE id=$8`,
            [name, location || null, text, starsVal, proof_img || null, activeVal, positionVal, id]
        );
        res.json({ updated: result.rowCount });
    } catch (err) {
        console.error("Erro ao atualizar avaliação:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

// ── DELETE ────────────────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    try {
        const result = await pool.query("DELETE FROM reviews WHERE id=$1", [id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        console.error("Erro ao remover avaliação:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

module.exports = router;