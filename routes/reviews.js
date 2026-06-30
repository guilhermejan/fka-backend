const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, location, text, stars, proof_img, active FROM reviews WHERE active = 1 ORDER BY position ASC, id ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar avaliações:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.get("/admin", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM reviews ORDER BY position ASC, id ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar avaliações:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    const { name, location, text, stars, proof_img, active, position } = req.body;

    if (!name || !text) {
        return res.status(400).json({ error: "Nome e texto são obrigatórios" });
    }

    const starsVal = Math.min(5, Math.max(1, parseInt(stars) || 5));

    try {
        const result = await pool.query(
            `INSERT INTO reviews (name, location, text, stars, proof_img, active, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [name, location, text, starsVal, proof_img || null, active ? 1 : 0, parseInt(position) || 0]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error("Erro ao criar avaliação:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { name, location, text, stars, proof_img, active, position } = req.body;

    if (!name || !text) {
        return res.status(400).json({ error: "Nome e texto são obrigatórios" });
    }

    const starsVal = Math.min(5, Math.max(1, parseInt(stars) || 5));

    try {
        const result = await pool.query(
            `UPDATE reviews
             SET name=$1, location=$2, text=$3, stars=$4, proof_img=$5, active=$6, position=$7
             WHERE id=$8`,
            [name, location, text, starsVal, proof_img || null, active ? 1 : 0, parseInt(position) || 0, id]
        );
        res.json({ updated: result.rowCount });
    } catch (err) {
        console.error("Erro ao atualizar avaliação:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

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