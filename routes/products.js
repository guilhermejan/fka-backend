const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

// ===============================
// GET todos os produtos
// ===============================
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===============================
// POST criar produto
// ===============================
router.post("/", authMiddleware, async (req, res) => {
    const { name, cat, price, oldprice, desc, active, img, badge, featured } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO products (name, cat, price, oldprice, description, active, img, badge, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [name, cat, price, oldprice || null, desc, active ? 1 : 0, img, badge, featured || 0]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, cat, price, oldprice, desc, active, img, badge, featured } = req.body;
    try {
        const result = await pool.query(
            `UPDATE products
             SET name=$1, cat=$2, price=$3, oldprice=$4, description=$5,
                 active=$6, img=$7, badge=$8, featured=$9
             WHERE id=$10`,
            [name, cat, price, oldprice || null, desc, active ? 1 : 0, img, badge, featured || 0, id]
        );
        res.json({ updated: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ===============================
// DELETE remover produto
// ===============================
router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;