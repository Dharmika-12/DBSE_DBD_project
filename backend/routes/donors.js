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
        latitude,
        longitude,
 
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
 
    if (!name || !age || !blood_group || !phone || !city) {
        return res.status(400).json({
            message: "Please fill all personal details",
        });
    }
 
    try {
        // -------------------------------------------------
        // Prevent duplicate registrations with the same phone
        // number (this is what was creating duplicate "ram"
        // rows in Find Donor results).
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
        //
        // This is NOT final medical clearance.
        // Final eligibility must be decided by
        // qualified blood-bank medical staff.
        // -------------------------------------------------
 
        const ageOutOfRange = Number(age) < 18 || Number(age) > 65;
 
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
        // Insert donor
        // -------------------------------------------------
 
        const query = `
            INSERT INTO donors
            (
                name, age, blood_group, phone, city,
                latitude, longitude, blood_bank_id,
                infection, antibiotics, surgery,
                chronic_illness, feeling_well,
                eligibility_status, available,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
 
        const [result] = await pool.query(query, [
            name,
            age,
            blood_group,
            phone,
            city,
            latitude || null,
            longitude || null,
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
                latitude: latitude || null,
                longitude: longitude || null,
                blood_bank_id: blood_bank_id || null,
                eligibility_status: eligibility,
                available,
            },
        });
    } catch (error) {
        console.error(error);
 
        return res.status(500).json({
            message: "Unable to register donor",
        });
    }
});
 
// =====================================================
// 2. FIND DONORS
//
// IMPORTANT:
// DO NOT LIMIT TO A RADIUS.
// Every matching donor is returned.
//
// Distance is returned two ways:
//   - distance: from the searcher's current location to the
//     donor's own location
//   - bank_distance: from the searcher's current location to
//     the donor's preferred blood bank (if they chose one)
// =====================================================
 
router.get("/", async (req, res) => {
    const { bloodGroup, city, latitude, longitude } = req.query;
 
    let query = `
        SELECT
            d.id,
            d.name,
            d.age,
            d.blood_group,
            d.phone,
            d.city,
            d.latitude,
            d.longitude,
            d.available,
            d.eligibility_status,
 
            bb.id   AS blood_bank_id,
            bb.name AS blood_bank_name,
            bb.address AS blood_bank_address,
            bb.city AS blood_bank_city,
            bb.latitude AS blood_bank_latitude,
            bb.longitude AS blood_bank_longitude
    `;
 
    const params = [];
 
    if (latitude && longitude) {
        query += `,
            (
                6371 * ACOS(
                    LEAST(1, GREATEST(-1,
                        COS(RADIANS(?)) * COS(RADIANS(d.latitude)) *
                        COS(RADIANS(d.longitude) - RADIANS(?)) +
                        SIN(RADIANS(?)) * SIN(RADIANS(d.latitude))
                    ))
                )
            ) AS distance,
            (
                6371 * ACOS(
                    LEAST(1, GREATEST(-1,
                        COS(RADIANS(?)) * COS(RADIANS(bb.latitude)) *
                        COS(RADIANS(bb.longitude) - RADIANS(?)) +
                        SIN(RADIANS(?)) * SIN(RADIANS(bb.latitude))
                    ))
                )
            ) AS bank_distance
        `;
 
        params.push(
            latitude,
            longitude,
            latitude,
            latitude,
            longitude,
            latitude
        );
    } else {
        query += `,
            NULL AS distance,
            NULL AS bank_distance
        `;
    }
 
    query += `
        FROM donors d
        LEFT JOIN blood_banks bb ON d.blood_bank_id = bb.id
        WHERE 1 = 1
    `;
 
    if (bloodGroup) {
        query += ` AND d.blood_group = ? `;
        params.push(bloodGroup);
    }
 
    if (city) {
        query += ` AND LOWER(d.city) LIKE LOWER(?) `;
        params.push(`%${city}%`);
    }
 
    query += ` AND d.available = true `;
 
    query += `
        ORDER BY
            CASE WHEN distance IS NULL THEN 1 ELSE 0 END,
            distance ASC
    `;
 
    try {
        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (error) {
        console.error(error);
 
        res.status(500).json({
            message: "Unable to find donors",
        });
    }
});
 
module.exports = router;