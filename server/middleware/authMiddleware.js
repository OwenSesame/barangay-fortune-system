import jwt from 'jsonwebtoken';

/**
 * Middleware to extract and verify the JWT token from the Authorization header.
 * Attaches the decoded token payload to req.user.
 */
export const verifyToken = (req, res, next) => {
    // 1. Get the token from the header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: "Access Denied: No token provided." });
    }

    const token = authHeader.split(' ')[1]; // Format is "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: "Access Denied: Malformed token." });
    }

    // 2. Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains { id, role, iat, exp }
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Session expired. Please log in again." });
        }
        return res.status(401).json({ error: "Invalid token." });
    }
};

/**
 * Middleware factory to enforce Role-Based Access Control (RBAC).
 * @param {string[]} allowedRoles - Array of roles permitted to access the route.
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.user must exist (meaning verifyToken ran before this)
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: "Access Denied: Authentication required." });
        }

        // Check if the user's role is in the allowed list
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to perform this action." });
        }

        next(); // User has the required role, proceed
    };
};
