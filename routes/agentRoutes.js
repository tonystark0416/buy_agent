// routes/agentRoutes.js
const router = require('express').Router();
const  ctrl  = require('../controllers/agentController.js');

router.post('/', ctrl.chat);

module.exports = router;

