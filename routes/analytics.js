const express = require("express");
const router = express.Router();
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const authMiddleware = require("../middleware/authMiddleware");

const PROPERTY_ID = process.env.GA4_PROPERTY_ID; // "543445618"

// Credenciais da conta de serviço, lidas do .env como JSON em uma única linha.
// Ver instruções no .env.example sobre como formatar GA4_SERVICE_ACCOUNT_JSON.
let credentials = null;
try {
    credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || "{}");
} catch (err) {
    console.error("GA4_SERVICE_ACCOUNT_JSON inválido no .env:", err.message);
}

const analyticsClient = credentials && credentials.client_email
    ? new BetaAnalyticsDataClient({ credentials })
    : null;

router.use(authMiddleware);

function requireGA4(req, res, next) {
    if (!analyticsClient || !PROPERTY_ID) {
        return res.status(503).json({
            error: "Integração com Google Analytics não configurada no servidor."
        });
    }
    next();
}

router.get("/overview", requireGA4, async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            metrics: [
                { name: "screenPageViews" },
                { name: "activeUsers" },
                { name: "averageSessionDuration" },
                { name: "sessions" }
            ]
        });

        const row = response.rows && response.rows[0];
        const metricValues = row ? row.metricValues.map(m => Number(m.value)) : [0, 0, 0, 0];

        res.json({
            pageViews: metricValues[0] || 0,
            activeUsers: metricValues[1] || 0,
            avgSessionSeconds: Math.round(metricValues[2] || 0),
            sessions: metricValues[3] || 0,
            days
        });
    } catch (err) {
        console.error("Erro ao consultar GA4 (overview):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/traffic-sources", requireGA4, async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 10
        });

        const sources = (response.rows || []).map(row => ({
            channel: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value)
        }));

        res.json({ sources, days });
    } catch (err) {
        console.error("Erro ao consultar GA4 (traffic-sources):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/top-products", requireGA4, async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    try {
        const [viewsResponse] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            dimensions: [{ name: "customEvent:product_name" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { value: "product_view" }
                }
            },
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 10
        });

        const [clicksResponse] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            dimensions: [{ name: "customEvent:product_name" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { value: "whatsapp_click" }
                }
            },
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 10
        });

        const views = (viewsResponse.rows || [])
            .filter(row => row.dimensionValues[0].value)
            .map(row => ({
                product: row.dimensionValues[0].value,
                count: Number(row.metricValues[0].value)
            }));

        const clicks = (clicksResponse.rows || [])
            .filter(row => row.dimensionValues[0].value)
            .map(row => ({
                product: row.dimensionValues[0].value,
                count: Number(row.metricValues[0].value)
            }));

        res.json({ views, clicks, days });
    } catch (err) {
        console.error("Erro ao consultar GA4 (top-products):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/whatsapp-sources", requireGA4, async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
            dimensions: [{ name: "customEvent:source" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { value: "whatsapp_click" }
                }
            },
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 10
        });

        const sources = (response.rows || [])
            .filter(row => row.dimensionValues[0].value)
            .map(row => ({
                source: row.dimensionValues[0].value,
                count: Number(row.metricValues[0].value)
            }));

        res.json({ sources, days });
    } catch (err) {
        console.error("Erro ao consultar GA4 (whatsapp-sources):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

module.exports = router;