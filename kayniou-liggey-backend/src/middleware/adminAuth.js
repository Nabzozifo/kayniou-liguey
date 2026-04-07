const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminProtect = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Compte admin inactif' });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

module.exports = { adminProtect };
