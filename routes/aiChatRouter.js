const express = require('express');
const { aiChat } = require('../ai/openai.js');

const router = express.Router();

router.post('/', aiChat);

module.exports = router;

