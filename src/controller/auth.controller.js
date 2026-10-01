const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session.model');
const { sendEmail } = require('../service/email.service');
const OTP = require("../models/otp.model");
const { generateOTP, otpEmailTemplate } = require("../utils/util.otpgenerate.js");

// register
const register = async (req, res) => {
    try {
        const data = req.body;
        const existingUser = await User.findOne({ $or: [{ username: data.username }, { email: data.email }] });
        if (existingUser) { return res.status(409).json({ message: 'Username or email already exists' }); }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        data.password = hashedPassword;
        const user = await User.create(data);

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        await OTP.create({
            email: user.email,
            user: user._id,
            otpHash
        });
        console.log("CALLING SEND EMAIL");
        const html = otpEmailTemplate(otp);

        await sendEmail(
            user.email,
            "Verify your email",
            `Your OTP is ${otp}`,
            html
        );

        console.log("EMAIL FUNCTION COMPLETED");




        res.status(201).json({
            message: 'User registered successfully',
            user,
            verified: user.verified
        });

    } catch (error) {
        res.status(500).json({
            message: 'Registration failed',
            error: error.message
        });
    }
};

//login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        //verified
        if (!user.verified) {
            return res.status(404).json({
                message: "email not verified"
            });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        // 3. temp user's session
        const session = await Session.create({
            userId: user._id,
            refreshToken: "temporary",
            ip: req.ip,
            userAgent: req.get("User-Agent")
        });


        // 4. Create new refresh token
        const refresh_token = jwt.sign(
            {
                id: user._id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // 5. Hash refresh token
        const refreshTokenHash = await bcrypt.hash(
            refresh_token,
            10
        );

        // 6. Update session
        session.refreshToken = refreshTokenHash;
        session.revoked = false;
        session.ip = req.ip;
        session.userAgent = req.get("User-Agent");

        await session.save();

        // 7. Create new access token
        const access_token = jwt.sign(
            {
                id: user._id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // 8. Store refresh token in cookie
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 9. Response
        return res.status(200).json({
            message: "Login successful",
            access_token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

// get personal profile

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Profile fetched successfully',
            user: user
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

//get refresh token
const refreshToken = async (req, res) => {
    console.log("REFRESH TOKEN HIT");

    try {
        // Cookie se old refresh token
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({
                error: "Refresh token not found"
            });
        }

        // Old refresh token verify
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Session find karo
        console.log(decoded);
        const session = await Session.findById(decoded.sessionId);

        if (!session) {
            return res.status(404).json({
                error: "Session not found"
            });
        }

        // Check session revoked hai ya nahi
        if (session.revoked) {
            return res.status(401).json({
                error: "Session has been revoked"
            });
        }


        // Cookie token ko DB ke hash se compare karo
        const isMatch = await bcrypt.compare(
            token,
            session.refreshToken
        );

        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid refresh token"
            });
        }

        // Naya access token
        const accessToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Naya refresh token
        const newRefreshToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // New refresh token ko hash karo
        const newRefreshTokenHash = await bcrypt.hash(
            newRefreshToken,
            10
        );

        // Same session mein new hash store karo
        session.refreshToken = newRefreshTokenHash;

        await session.save();

        // New refresh token cookie mein
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false, // local HTTP development
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Access token refreshed",
            accessToken
        });

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            error: "Invalid or expired refresh token"
        });
    }
};

// api/logout

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: "Refresh token not found"
            });
        }

        // Access token se sessionId
        const sessionId = req.user.sessionId;

        // Session find
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                error: "Session not found"
            });
        }
        if (session.revoked) {
            return res.status(404).json({
                error: "already logout"
            });
        }

        // Refresh token verify
        const isMatch = await bcrypt.compare(
            refreshToken,
            session.refreshToken
        );

        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid refresh token"
            });
        }

        // Session revoke
        session.revoked = true;
        await session.save();

        // Cookie remove


        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

// verify email
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const otpData = await OTP.findOne({ email });

        if (!otpData) {
            return res.status(404).json({
                message: "OTP not found or expired"
            });
        }

        const isValid = await bcrypt.compare(otp, otpData.otpHash);

        if (!isValid) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const user = await User.findById(otpData.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.verified = true;
        await user.save();

        await OTP.deleteOne({ _id: otpData._id });

        res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Email verification failed",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    refreshToken,
    logout,
    verifyEmail
};

