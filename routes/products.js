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
        console.error("Erro ao buscar produtos:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.get("/admin", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM products ORDER BY id ASC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar produtos:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    const { name, cat, price, oldprice, desc, active, img, badge, featured } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: "Nome e preço são obrigatórios" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO products (name, cat, price, oldprice, description, active, img, badge, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [name, cat, parseFloat(price) || 0, oldprice ? parseFloat(oldprice) : null, desc, active ? 1 : 0, img, badge, parseInt(featured) || 0]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error("Erro ao criar produto:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.put("/featured/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    try {
        await pool.query(
            "UPDATE products SET featured = CASE WHEN id = $1 THEN 1 ELSE 0 END",
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Erro ao definir destaque:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { name, cat, price, oldprice, desc, active, img, badge, featured } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: "Nome e preço são obrigatórios" });
    }

    try {
        const result = await pool.query(
            `UPDATE products
             SET name=$1, cat=$2, price=$3, oldprice=$4, description=$5,
                 active=$6, img=$7, badge=$8, featured=$9
             WHERE id=$10`,
            [name, cat, parseFloat(price) || 0, oldprice ? parseFloat(oldprice) : null, desc, active ? 1 : 0, img, badge, parseInt(featured) || 0, id]
        );
        res.json({ updated: result.rowCount });
    } catch (err) {
        console.error("Erro ao atualizar produto:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    try {
        const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        console.error("Erro ao remover produto:", err.message);
        res.status(500).json({ error: "Erro interno. Tente novamente mais tarde." });
    }
});

module.exports = router;