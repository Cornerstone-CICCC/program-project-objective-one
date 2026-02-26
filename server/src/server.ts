// Server code
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import userRouter from './routes/user.routes';
import locationRouter from './routes/location.routes';
import skillRouter from './routes/skill.routes';
import userSkillRouter from './routes/userSkill.routes';

dotenv.config();

// Create server
const app = express();

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter((origin): origin is string => !!origin);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use('/users', userRouter);
app.use('/locations', locationRouter);
app.use('/skills', skillRouter);
app.use('/user-skills', userSkillRouter);

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Server is running!');
});

// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI!;
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI, { dbName: 'swappa' })
  .then(() => {
    console.log('Connected to MongoDB database');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
