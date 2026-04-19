const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const { fromBuffer: fileTypeFromBuffer } = require('file-type');

const DIR = path.join(__dirname, '../../private/id-docs');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

// Allowed MIME types and their magic byte signatures
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (_req, _file, cb) => {
    // Always .jpg extension — actual type verified post-upload
    const name = crypto.randomBytes(16).toString('hex') + '.jpg';
    cb(null, name);
  },
});

// First gate: reject obviously wrong MIME types declared by client
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé (JPEG, PNG, WEBP uniquement)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Second gate (post-upload): verify actual file content via magic bytes
async function verifyMagicBytes(req, res, next) {
  if (!req.file) return next();

  try {
    const buffer = fs.readFileSync(req.file.path);
    const type   = await fileTypeFromBuffer(buffer);

    if (!type || !ALLOWED_MIME.has(type.mime) || !ALLOWED_EXT.has('.' + type.ext)) {
      // Delete the file — it's not a real image
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Contenu de fichier invalide' });
    }
    next();
  } catch (err) {
    // If we can't read/check, remove and reject
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ success: false, message: 'Erreur lors de la vérification du fichier' });
  }
}

module.exports = { upload, verifyMagicBytes };
