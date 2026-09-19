const express = require("express");
const router = express.Router();
 
const pool = require("../config/db");
 
router.get("/", async (req, res) => {
    try {
        const [results] = await pool.query("SELECT * FROM blood_banks");
 
        res.json(results);
    } catch (error) {
        console.error(error);
 
        res.status(500).json({
            message: "Failed to fetch blood banks",
        });
    }
});
 
module.exports = router;