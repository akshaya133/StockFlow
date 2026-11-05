
const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    const {
        name,
        sku,
        description,
        quantity,
        cost_price,
        selling_price,
        low_stock_threshold
    } = req.body;

    if (!name || !sku) {
        return res.status(400).json({
            message: "Product name and SKU are required"
        });
    }

    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
        return res.status(400).json({
            message: "Quantity must be a non-negative integer"
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO products
            (organization_id, name, sku, description, quantity,
             cost_price, selling_price, low_stock_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                req.user.organizationId,
                name,
                sku,
                description || null,
                quantity ?? 0,
                cost_price ?? null,
                selling_price ?? null,
                low_stock_threshold ?? null
            ]
        );

        res.status(201).json({
            message: "Product added successfully",
            product: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists in your organization"
            });
        }

        res.status(500).json({
            message: "Failed to add product",
            error: error.message
        });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM products
             WHERE organization_id = $1
             ORDER BY created_at DESC`,
            [req.user.organizationId]
        );

        res.status(200).json({
            message: "Products fetched successfully",
            count: result.rows.length,
            products: result.rows
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    const {
        name,
        sku,
        description,
        quantity,
        cost_price,
        selling_price,
        low_stock_threshold
    } = req.body;

    if (!name || !sku) {
        return res.status(400).json({
            message: "Product name and SKU are required"
        });
    }

    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
        return res.status(400).json({
            message: "Quantity must be a non-negative integer"
        });
    }

    try {
        const result = await pool.query(
            `UPDATE products
             SET name = $1,
                 sku = $2,
                 description = $3,
                 quantity = $4,
                 cost_price = $5,
                 selling_price = $6,
                 low_stock_threshold = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND organization_id = $9
             RETURNING *`,
            [
                name,
                sku,
                description || null,
                quantity ?? 0,
                cost_price ?? null,
                selling_price ?? null,
                low_stock_threshold ?? null,
                req.params.id,
                req.user.organizationId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists in your organization"
            });
        }

        res.status(500).json({
            message: "Failed to update product",
            error: error.message
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM products
             WHERE id = $1 AND organization_id = $2
             RETURNING *`,
            [req.params.id, req.user.organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully",
            product: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
});

module.exports = router;
