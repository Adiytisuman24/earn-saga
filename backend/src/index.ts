import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import offerRoutes from './routes/offers';
import callbackRoutes from './routes/callback';
import walletRoutes from './routes/wallet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/callback', callbackRoutes);
app.use('/api/wallet', walletRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
