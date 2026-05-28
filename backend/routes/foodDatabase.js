const express = require("express");
const FoodDatabase = require("../models/FoodDatabase");

const router = express.Router();

router.get("/search", async (req, res) => {
    const query = req.query.q;

    const foods = await FoodDatabase.find({
        name: { $regex: query, $options: "i" }
    }).limit(20);

    res.json(foods);
});

module.exports = router;