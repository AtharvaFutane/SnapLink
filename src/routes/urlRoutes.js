const express = require('express');
const router = express.Router();
const { shorten, stats, deleteUrl } = require('../controllers/urlController');

router.post('/shorten', shorten);
router.get('/stats/:code', stats);
router.delete('/:code', deleteUrl);

module.exports = router;
