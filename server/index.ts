import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db';
import errorHandler from './src/middlewares/errorHandler';
import apiRouter from './src/routes';



const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// router
app.use('/api', apiRouter);
// hello

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));
