import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const now = new Date();
    const dir = path.join(
      "./backend/data/photos",
      `${now.getFullYear()}`,
      `${String(now.getMonth() + 1).padStart(2, "0")}`,
      `${String(now.getDate()).padStart(2, "0")}`
    );
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });

async function createThumbnail(filePath) {
  const thumbPath = filePath.replace(/(\.[^./]+)$/, "-thumb$1");
  await sharp(filePath).resize(512).jpeg({ quality: 80 }).toFile(thumbPath);
  return thumbPath;
}

router.post("/photos", upload.array("photos"), async (req, res) => {
  const files = req.files ?? [];
  const results = [];

  for (const file of files) {
    const thumbPath = await createThumbnail(file.path);
    results.push({
      url: file.path.replace("backend/data", ""),
      thumbUrl: thumbPath.replace("backend/data", "")
    });
  }

  res.status(201).json({ photos: results });
});

export default router;
