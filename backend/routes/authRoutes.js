const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/user', authController.registerUser);
router.post('/register/agen', authController.registerAgen);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);

module.exports = router;