import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
await fs.ensureDir(uploadsDir);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.har')) {
      cb(null, true);
    } else {
      cb(new Error('Only HAR files are allowed'), false);
    }
  }
});

// Helper function to run harwise CLI commands
const runHarwiseCommand = (args, options = {}) => {
  return new Promise((resolve, reject) => {
    const harwisePath = path.join(__dirname, '../../../index.js');
    const child = spawn('node', [harwisePath, ...args], {
      cwd: options.cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Harwise UI Server is running' });
});

// Upload HAR file
app.post('/api/upload', upload.single('harFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'File uploaded successfully',
    fileId: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path
  });
});

// Get HAR file stats
app.post('/api/stats', async (req, res) => {
  try {
    const { fileId } = req.body;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const result = await runHarwiseCommand(['stats', filePath]);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate tests
app.post('/api/gen-tests', async (req, res) => {
  try {
    const { fileId, config } = req.body;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const args = ['gen', 'tests', filePath];
    if (config) {
      const configPath = path.join(uploadsDir, `config-${uuidv4()}.json`);
      await fs.writeJson(configPath, config);
      args.push('--config', configPath);
    }

    const result = await runHarwiseCommand(args);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run tests
app.post('/api/test', async (req, res) => {
  try {
    const { fileId, config } = req.body;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const args = ['test', filePath];
    if (config) {
      const configPath = path.join(uploadsDir, `config-${uuidv4()}.json`);
      await fs.writeJson(configPath, config);
      args.push('--config', configPath);
    }

    const result = await runHarwiseCommand(args);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare HAR files
app.post('/api/compare', async (req, res) => {
  try {
    const { fileId1, fileId2 } = req.body;
    const filePath1 = path.join(uploadsDir, fileId1);
    const filePath2 = path.join(uploadsDir, fileId2);
    
    if (!await fs.pathExists(filePath1) || !await fs.pathExists(filePath2)) {
      return res.status(404).json({ error: 'One or both files not found' });
    }

    const result = await runHarwiseCommand(['compare', filePath1, filePath2]);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Insomnia collection
app.post('/api/gen-insomnia', async (req, res) => {
  try {
    const { fileId } = req.body;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const result = await runHarwiseCommand(['gen', 'insomnia', filePath]);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate cURL commands
app.post('/api/gen-curl', async (req, res) => {
  try {
    const { fileId } = req.body;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const result = await runHarwiseCommand(['gen', 'curl', filePath]);
    res.json({ success: true, output: result.stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List uploaded files
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const fileList = await Promise.all(
      files
        .filter(file => file.endsWith('.har'))
        .map(async (file) => {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);
          return {
            id: file,
            name: file,
            size: stats.size,
            created: stats.birthtime
          };
        })
    );
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete uploaded file
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(uploadsDir, fileId);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.remove(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Harwise UI Server running on port ${port}`);
});