const express = require("express");
const cloudinary = require("cloudinary").v2;
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post("/sign", authMiddleware, (req, res) => {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const params = { timestamp, folder: "fka" };

        const signature = cloudinary.utils.api_sign_request(
            params,
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            timestamp,
            signature,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (err) {
        console.error("Erro ao assinar upload:", err.message);
        res.status(500).json({ error: "Erro ao gerar assinatura de upload" });
    }
});

module.exports = router;