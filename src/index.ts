import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { authRoutes } from "./auth";
import dotenv from 'dotenv';  
import { eventRoutes } from "./events";
import path from "node:path";

dotenv.config({ path: path.resolve('/data/.env')})

const PORT : string | undefined = process.env.PORT ||  '9000';

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use('/api', authRoutes);
app.use('/api', eventRoutes);
app.listen(9000, '0.0.0.0', () => console.log('Server running on port 9000'));




