const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// =====================================================
// 1. REGISTER DONOR
// NO LOGIN / NO TOKEN REQUIRED
// =====================================================

router.post("/", async (req, res) => {
    const {
        name,
        age,
        blood_group,
        phone,
        city,
        address,
        blood_bank_id,
        infection,
        antibiotics,
        surgery,
        chronic_illness,
        feeling_well,
    } = req.body;

    // -------------------------------------------------
    // Required fields
    // -------------------------------------------------

    if (
        !name ||
        !age ||
        !blood_group ||
        !phone ||
        !city ||
        !address
    ) {
        return res.status(400).json({
            message: "Please fill all personal details including address",
        });
    }

    try {
        // -------------------------------------------------
        // Prevent duplicate donor registration
        // -------------------------------------------------

        const [existing] = await pool.query(
            `SELECT id FROM donors WHERE phone = ?`,
            [phone]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message:
                    "A donor with this phone number is already registered.",
            });
        }

        // -------------------------------------------------
        // PRE-SCREENING
        // This is NOT final medical clearance.
        // -------------------------------------------------

        const ageOutOfRange =
            Number(age) < 18 || Number(age) > 65;

        const failedHealthCondition =
            ageOutOfRange ||
            infection === "Yes" ||
            antibiotics === "Yes" ||
            surgery === "Yes" ||
            chronic_illness === "Yes" ||
            feeling_well === "No";

        const eligibility = failedHealthCondition
            ? "NOT_ELIGIBLE"
            : "PRELIMINARILY_ELIGIBLE";

        const available = !failedHealthCondition;

        // -------------------------------------------------
        // INSERT DONOR
        // -------------------------------------------------

        const query = `
            INSERT INTO donors
            (
                name,
                age,
                blood_group,
                phone,
                city,
                address,
                blood_bank_id,
                infection,
                antibiotics,
                surgery,
                chronic_illness,
                feeling_well,
                eligibility_status,
                available,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            name,
            age,
            blood_group,
            phone,
            city,
            address,
            blood_bank_id || null,
            infection,
            antibiotics,
            surgery,
            chronic_illness,
            feeling_well,
            eligibility,
            available,
        ]);

        return res.status(201).json({
            message: "Donor registration completed",

            reason: ageOutOfRange
                ? "Donors must be between 18 and 65 years old."
                : failedHealthCondition
                ? "One or more health screening answers indicate you should not donate right now."
                : null,

            donor: {
                id: result.insertId,
                name,
                age,
                blood_group,
                phone,
                city,
                address,
                blood_bank_id: blood_bank_id || null,
                eligibility_status: eligibility,
                available,
            },
        });
    } catch (error) {
        console.error("DONOR REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Unable to register donor",
        });
    }
});

// =====================================================
// 2. FIND DONORS
//
// No latitude/longitude.
// No distance calculation.
//
// Search by blood group and city.
// =====================================================

router.get("/", async (req, res) => {
    const { bloodGroup, city } = req.query;

    let query = `
        SELECT
            d.id,
            d.name,
            d.age,
            d.blood_group,
            d.phone,
            d.city,
            d.address,
            d.available,
            d.eligibility_status,

            bb.id AS blood_bank_id,
            bb.name AS blood_bank_name,
            bb.address AS blood_bank_address,
            bb.city AS blood_bank_city

        FROM donors d

        LEFT JOIN blood_banks bb
            ON d.blood_bank_id = bb.id

        WHERE d.available = true
    `;

    const params = [];

    // -------------------------------------------------
    // Blood group filter
    // -------------------------------------------------

    if (bloodGroup) {
        query += ` AND d.blood_group = ? `;
        params.push(bloodGroup);
    }

    // -------------------------------------------------
    // City filter
    // Partial match
    // Example: "koti" matches "Koti"
    // -------------------------------------------------

    if (city) {
        query += ` AND LOWER(d.city) LIKE LOWER(?) `;
        params.push(`%${city}%`);
    }

    query += `
        ORDER BY d.name ASC
    `;

    try {
        const [results] = await pool.query(
            query,
            params
        );

        res.json(results);
    } catch (error) {
        console.error("FIND DONOR ERROR:", error);

        res.status(500).json({
            message: "Unable to find donors",
        });
    }
});

module.exports = router;