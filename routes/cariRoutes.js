// routes/cariRoutes.js

const express = require('express');
const router = express.Router();
const Cari = require('../models/Cari');

// Durum bazında aday cari sayısını al
router.get('/durumlar', async (req, res) => {
    try {
        const potansiyel = await Cari.countDocuments({ durum: 'potansiyel' });
        const kesifBekleyen = await Cari.countDocuments({ durum: 'keşif bekleyen' });
        const olumsuz = await Cari.countDocuments({ durum: 'olumsuz' });

        res.json({
            potansiyel,
            kesifBekleyen,
            olumsuz,
        });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası', error: err });
    }
});

module.exports = router;
