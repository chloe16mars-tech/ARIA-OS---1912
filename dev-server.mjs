import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

const browserDistFolder = join(__dirname, 'dist', 'app', 'browser');
app.use(express.static(browserDistFolder));

app.use((req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Dev API server running on port ${port}`);
});
