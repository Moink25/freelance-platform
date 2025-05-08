require("dotenv").config();
const jwt = require("jsonwebtoken");

const tokenVerification = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      console.error("No authorization header found");
      return res
        .status(403)
        .json({ success: false, message: "Token Required", status: 403 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.error("Token not found in authorization header");
      return res
        .status(403)
        .json({ success: false, message: "Token Required", status: 403 });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.message);
        return res
          .status(401)
          .json({ success: false, message: "Invalid Token", status: 401 });
      }

      console.log("JWT decoded user data:", decoded);

      // Ensure user and userId exist
      if (!decoded || !decoded.userId) {
        console.error("Invalid token payload: missing userId");
        return res
          .status(401)
          .json({
            success: false,
            message: "Invalid Token Format",
            status: 401,
          });
      }

      // Set both properties consistently
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };

      console.log(
        "Auth middleware set: req.userId =",
        req.userId,
        "req.user.id =",
        req.user.id
      );

      next();
    });
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Authentication error", status: 500 });
  }
};

module.exports = tokenVerification;
