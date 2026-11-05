
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await client.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
            [name, email.toLowerCase().trim(), hashedPassword]
        );

        const user = userResult.rows[0];

        const organizationResult = await client.query(
            "INSERT INTO organizations (name, owner_id) VALUES ($1, $2) RETURNING id, name",
            [organizationName, user.id]
        );

        const organization = organizationResult.rows[0];

        await client.query(
            "UPDATE users SET organization_id = $1 WHERE id = $2",
            [organization.id, user.id]
        );

        await client.query("COMMIT");

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: organization.id
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "Account created successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                organizationId: organization.id,
                organizationName: organization.name
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        res.status(500).json({
            message: "Signup failed",
            error: error.message
        });

    } finally {
        client.release();
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.name, users.email, users.password,
                    users.organization_id, organizations.name AS organization_name
             FROM users
             JOIN organizations ON users.organization_id = organizations.id
             WHERE users.email = $1`,
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: user.organization_id
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                organizationId: user.organization_id,
                organizationName: user.organization_name
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

module.exports = router;
