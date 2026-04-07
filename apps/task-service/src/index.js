import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'task-service' });
});

app.listen(PORT, () => {
  console.log(`Task service running on port ${PORT}`);
});