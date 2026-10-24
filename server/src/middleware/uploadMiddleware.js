import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target development uploads directory: server/uploads/avatars
export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/avatars");

// Ensure upload directory exists safely
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Maximum allowed image file size: 2 Megabytes
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validates binary magic bytes to guarantee file authenticity
 * Prevents disguised executables or malicious files with spoofed extensions / MIME types
 * 
 * @param {Buffer} buffer
 * @returns {'jpg'|'png'|'webp'|null} Verified extension or null
 */
export function verifyImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return "webp";
  }

  return null;
}

// Multer memory storage stages the file in RAM before validation and disk write
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
      const err = new Error(
        "Invalid file type: Only JPEG, PNG, and WebP images are permitted."
      );
      err.statusCode = 400;
      return cb(err, false);
    }

    cb(null, true);
  }
});

/**
 * Middleware handling single profile avatar upload ('avatar' field)
 * Includes custom error mapping for Multer limits
 */
export function handleAvatarUpload(req, res, next) {
  const singleUpload = upload.single("avatar");

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: {
              message: "File Too Large: Profile image must be smaller than 2MB.",
              statusCode: 400,
              maxBytes: MAX_FILE_SIZE_BYTES
            },
            timestamp: new Date().toISOString()
          });
        }

        return res.status(400).json({
          success: false,
          error: {
            message: `Upload Error: ${err.message}`,
            statusCode: 400
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(err.statusCode || 400).json({
        success: false,
        error: {
          message: err.message || "Failed to process uploaded file.",
          statusCode: err.statusCode || 400
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation Error: No image file provided in 'avatar' field.",
          statusCode: 400
        },
        timestamp: new Date().toISOString()
      });
    }

    // Binary inspection: verify magic bytes before writing to disk
    const verifiedExt = verifyImageMagicBytes(req.file.buffer);
    if (!verifiedExt) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Security Error: File content does not match allowed image formats (JPEG, PNG, WebP). Corrupted or spoofed file rejected.",
          statusCode: 400
        },
        timestamp: new Date().toISOString()
      });
    }

    req.verifiedImageExtension = verifiedExt;
    next();
  });
}
