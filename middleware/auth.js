const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const protectAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.isAdmin !== true) {
      return res.status(403).json({ message: "Not authorized" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = protectAdmin;
