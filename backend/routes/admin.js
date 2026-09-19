const express = require("express");

const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRole
} = require("../middleware/auth");

const router = express.Router();


// =====================================
// HOME STATISTICS
// =====================================

router.get("/stats", async (req, res) => {

    try {

        const [[donors]] =
            await pool.query(
                `SELECT COUNT(*) AS count
                 FROM donors`
            );


        const [[bloodBanks]] =
            await pool.query(
                `SELECT COUNT(*) AS count
                 FROM blood_banks`
            );


        const [[collectors]] =
            await pool.query(
                `SELECT COUNT(*) AS count
                 FROM users
                 WHERE role = 'COLLECTOR'`
            );


        const [[requests]] =
            await pool.query(
                `SELECT COUNT(*) AS count
                 FROM collection_requests`
            );


        res.json({
            donors: donors.count,
            bloodBanks: bloodBanks.count,
            collectors: collectors.count,
            requests: requests.count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =====================================
// ADMIN DASHBOARD
// =====================================

router.get(
    "/dashboard",

    authenticateToken,

    authorizeRole("ADMIN"),

    async (req, res) => {

        try {

            const [users] =
                await pool.query(
                    `SELECT
                        id,
                        name,
                        email,
                        phone,
                        role,
                        created_at
                     FROM users
                     ORDER BY created_at DESC`
                );


            const [requests] =
                await pool.query(
                    `SELECT
                        cr.*,
                        u.name AS donorName
                     FROM collection_requests cr

                     JOIN donors d
                     ON cr.donor_id = d.id

                     JOIN users u
                     ON d.user_id = u.id

                     ORDER BY cr.requested_at DESC`
                );


            res.json({
                users,
                requests
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


module.exports = router;