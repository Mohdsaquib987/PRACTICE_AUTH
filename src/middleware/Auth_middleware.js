
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Token nahi diya
        if (!authHeader) {
            return res.status(401).json({
                message: 'Authorization token is required'
            });
        }

        // Bearer token check
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: 'Invalid authorization format'
            });
        }

        const token = parts[1];

        // JWT verify
        const decoded = jwt.verify(
            token,
            config.JWT_SECRET
        );

        // Payload ko request ke andar store karna
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;

