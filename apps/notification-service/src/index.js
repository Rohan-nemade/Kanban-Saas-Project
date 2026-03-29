import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4005;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Simple endpoint for other microservices to trigger notifications
app.post('/api/notifications/emit', (req, res) => {
  const { event, roomId, payload } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'event is required' });
  }

  console.log('Emit event:', { event, roomId, payload });

  if (roomId) {
    io.to(roomId).emit(event, payload);
  } else {
    io.emit(event, payload);
  }

  res.status(200).json({ success: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room: ${projectId}`);
  });

  socket.on('leave_project', (projectId) => {
    socket.leave(projectId);
    console.log(`Socket ${socket.id} left project room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});