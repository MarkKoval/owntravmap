import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const now = new Date();
    const folder = path.join(
      __dirname,
      '..',
      'data',
      'photos',
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0')
    );
    await fs.mkdir(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/', upload.array('photos'), (req, res) => {
  const files = (req.files || []).map((file) => ({
    url: `/photos/${path.relative(path.join(__dirname, '..', 'data', 'photos'), file.path)}`.replace(/\\/g, '/'),
    name: file.originalname,
    size: file.size
  }));
  res.status(201).json({ files });
});

export default router;
