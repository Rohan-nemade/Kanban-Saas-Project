import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

app.use('/api/projects', projectRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'project-service' });
});

app.listen(PORT, () => {
  console.log(`Project service running on port ${PORT}`);
});