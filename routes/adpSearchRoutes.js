// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const search = require('../controllers/adpSearchController');

router.get('/', search.search);

module.exports = router;