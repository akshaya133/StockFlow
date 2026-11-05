const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) AS total_products,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COUNT(*) FILTER (
                    WHERE quantity <= COALESCE(low_stock_threshold, 5)
                ) AS low_stock_items
             FROM products
             WHERE organization_id = $1`,
            [req.user.organizationId]
        );

        res.status(200).json({
            message: "Dashboard data fetched successfully",
            dashboard: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
});

module.exports = router;