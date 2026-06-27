const express = require("express");
const router = express.Router();
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const authMiddleware = require("../middleware/authMiddleware");

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

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

// Converte o parâmetro "days" para startDate/endDate do GA4
function resolveDateRange(days) {
    if (days === "today") {
        return { startDate: "today", endDate: "today" };
    }
    if (days === "yesterday") {
        return { startDate: "yesterday", endDate: "yesterday" };
    }
    const n = parseInt(days, 10) || 30;
    return { startDate: `${n}daysAgo`, endDate: "today" };
}

router.get("/overview", requireGA4, async (req, res) => {
    const { startDate, endDate } = resolveDateRange(req.query.days || "30");
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: "screenPageViews" },
                { name: "activeUsers" },
                { name: "averageSessionDuration" },
                { name: "sessions" }
            ]
        });

        const row = response.rows && response.rows[0];
        const v = row ? row.metricValues.map(m => Number(m.value)) : [0, 0, 0, 0];

        res.json({
            pageViews: v[0] || 0,
            activeUsers: v[1] || 0,
            avgSessionSeconds: Math.round(v[2] || 0),
            sessions: v[3] || 0
        });
    } catch (err) {
        console.error("Erro ao consultar GA4 (overview):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/traffic-sources", requireGA4, async (req, res) => {
    const { startDate, endDate } = resolveDateRange(req.query.days || "30");
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 10
        });

        const sources = (response.rows || []).map(row => ({
            channel: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value)
        }));

        res.json({ sources });
    } catch (err) {
        console.error("Erro ao consultar GA4 (traffic-sources):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/top-products", requireGA4, async (req, res) => {
    const { startDate, endDate } = resolveDateRange(req.query.days || "30");
    try {
        const [viewsResponse] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
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
            dateRanges: [{ startDate, endDate }],
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

        res.json({ views, clicks });
    } catch (err) {
        console.error("Erro ao consultar GA4 (top-products):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

router.get("/whatsapp-sources", requireGA4, async (req, res) => {
    const { startDate, endDate } = resolveDateRange(req.query.days || "30");
    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
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

        res.json({ sources });
    } catch (err) {
        console.error("Erro ao consultar GA4 (whatsapp-sources):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

// NOVO: visitas por dia para o gráfico
router.get("/daily-views", requireGA4, async (req, res) => {
    const rawDays = req.query.days || "30";

    // Para "today" e "yesterday" retorna um único ponto (sem gráfico de linha)
    const { startDate, endDate } = resolveDateRange(rawDays);

    try {
        const [response] = await analyticsClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date" } }]
        });

        const data = (response.rows || []).map(row => {
            const raw = row.dimensionValues[0].value; // "20260101"
            const d = new Date(
                parseInt(raw.slice(0, 4)),
                parseInt(raw.slice(4, 6)) - 1,
                parseInt(raw.slice(6, 8))
            );
            const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            return {
                label,
                value: Number(row.metricValues[0].value)
            };
        });

        res.json({ data });
    } catch (err) {
        console.error("Erro ao consultar GA4 (daily-views):", err.message);
        res.status(500).json({ error: "Erro ao consultar o Google Analytics." });
    }
});

module.exports = router;