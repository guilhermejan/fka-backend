const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: "Não autenticado" });
    }

    try {
        const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

module.exports = authMiddleware;