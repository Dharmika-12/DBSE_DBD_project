const express = require("express");

const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/auth");

const router = express.Router();


router.get(
    "/profile",

    authenticateToken,

    authorizeRole("COLLECTOR"),

    async (req, res) => {

        try {

            const [users] =
                await pool.execute(
                    `SELECT
                        id,
                        name,
                        email,
                        phone,
                        role
                     FROM users
                     WHERE id = ?`,

                    [req.user.id]
                );


            res.json(users[0]);

        } catch (error) {

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


module.exports = router;