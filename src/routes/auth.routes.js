const express = require('express');
const router = express.Router();
const {
    register,
    getProfile,
    login,
    refreshToken,
    logout,
    verifyEmail
} = require('../controller/auth.controller');
const authMiddleware = require('../middleware/Auth_middleware');

router.post('/registered',register);

// Login route
router.post('/login', login);

//get personal info
router.get('/profile', authMiddleware, getProfile);

//get refreshtoken
router.get('/refresh-token', refreshToken);

//get logout route
router.post('/logout', authMiddleware, logout);

//verify email
router.post("/verify-email", verifyEmail);




module.exports = router;