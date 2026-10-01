const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// =====================================================
// COLLECTOR AUTHENTICATION
// =====================================================

function collectorAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "Collector login required",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "COLLECTOR") {
            return res.status(403).json({
                message: "Only collectors can access this",
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

// =====================================================
// DONOR CREATES COLLECTION REQUEST
// NO LOGIN REQUIRED
// =====================================================

router.post("/", async (req, res) => {
    const {
        donor_id,
        blood_bank_id,
        address,
    } = req.body;

    // -------------------------------------------------
    // Validate donor ID
    // -------------------------------------------------

    if (!donor_id) {
        return res.status(400).json({
            message: "Donor ID is required",
        });
    }

    // -------------------------------------------------
    // Validate address
    // -------------------------------------------------

    if (!address || !address.trim()) {
        return res.status(400).json({
            message: "Collection address is required",
        });
    }

    try {
        // -------------------------------------------------
        // Check donor
        // -------------------------------------------------

        const [results] = await pool.query(
            `
            SELECT
                id,
                name,
                blood_group,
                available,
                eligibility_status
            FROM donors
            WHERE id = ?
            `,
            [donor_id]
        );

        if (results.length === 0) {
            return res.status(404).json({
                message: "Donor not found",
            });
        }

        const donor = results[0];

        // -------------------------------------------------
        // Check eligibility
        // -------------------------------------------------

        if (
            donor.eligibility_status ===
            "NOT_ELIGIBLE"
        ) {
            return res.status(400).json({
                message:
                    "This donor cannot create a collection request.",
            });
        }

        // -------------------------------------------------
        // CREATE COLLECTION REQUEST
        // -------------------------------------------------

        const [insertResult] = await pool.query(
            `
            INSERT INTO collection_requests
            (
                donor_id,
                blood_bank_id,
                address,
                status,
                requested_at
            )
            VALUES (?, ?, ?, 'PENDING', NOW())
            `,
            [
                donor_id,
                blood_bank_id || null,
                address.trim(),
            ]
        );

        res.status(201).json({
            message:
                "Collection request created successfully",

            requestId:
                insertResult.insertId,

            donor,

            status: "PENDING",
        });
    } catch (error) {
        console.error(
            "CREATE REQUEST ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Unable to create collection request",
        });
    }
});

// =====================================================
// COLLECTOR SEES ALL PENDING REQUESTS
//
// NO COLLECTOR LOCATION
// NO DISTANCE
// =====================================================

router.get(
    "/nearby",
    collectorAuth,
    async (req, res) => {
        const collectorId = req.user.id;

        try {
            const [results] = await pool.query(
                `
                SELECT
                    cr.id,
                    cr.donor_id,
                    cr.address,
                    cr.status,
                    cr.requested_at,
                    cr.collector_id,

                    d.name AS donor_name,
                    d.phone AS donor_phone,
                    d.blood_group,
                    d.city,

                    bb.name AS blood_bank_name,
                    bb.address AS blood_bank_address

                FROM collection_requests cr

                JOIN donors d
                    ON cr.donor_id = d.id

                LEFT JOIN blood_banks bb
                    ON cr.blood_bank_id = bb.id

                WHERE
                    cr.status = 'PENDING'

                    OR

                    (
                        cr.status = 'ACCEPTED'
                        AND cr.collector_id = ?
                    )

                ORDER BY
                    CASE
                        WHEN cr.status = 'PENDING'
                        THEN 0
                        ELSE 1
                    END,

                    cr.requested_at DESC
                `,
                [collectorId]
            );

            res.json(results);
        } catch (error) {
            console.error(
                "GET REQUESTS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to fetch collection requests",
            });
        }
    }
);

// =====================================================
// COLLECTOR ACCEPTS REQUEST
// =====================================================

router.patch(
    "/:id/accept",
    collectorAuth,
    async (req, res) => {
        const requestId = req.params.id;
        const collectorId = req.user.id;

        try {
            const [result] = await pool.query(
                `
                UPDATE collection_requests

                SET
                    status = 'ACCEPTED',
                    collector_id = ?,
                    accepted_at = NOW()

                WHERE
                    id = ?
                    AND status = 'PENDING'
                `,
                [
                    collectorId,
                    requestId,
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message:
                        "Request is already accepted or does not exist",
                });
            }

            res.json({
                message:
                    "Collection request accepted",
            });
        } catch (error) {
            console.error(
                "ACCEPT ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to accept request",
            });
        }
    }
);

// =====================================================
// COLLECTOR COMPLETES REQUEST
// =====================================================

router.patch(
    "/:id/complete",
    collectorAuth,
    async (req, res) => {
        const requestId = req.params.id;
        const collectorId = req.user.id;

        try {
            const [result] = await pool.query(
                `
                UPDATE collection_requests

                SET
                    status = 'COMPLETED'

                WHERE
                    id = ?
                    AND collector_id = ?
                    AND status = 'ACCEPTED'
                `,
                [
                    requestId,
                    collectorId,
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message:
                        "Request cannot be completed",
                });
            }

            res.json({
                message:
                    "Blood collection completed successfully",
            });
        } catch (error) {
            console.error(
                "COMPLETE ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to complete request",
            });
        }
    }
);

module.exports = router;