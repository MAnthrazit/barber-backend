import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { authRoutes } from "./auth";
import dotenv from 'dotenv';  
import { eventRoutes } from "./events";
import path from "node:path";

dotenv.config({ path: path.resolve('/data/.env')})

const PORT : string | undefined = process.env.PORT ||  '443';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api', eventRoutes);
app.listen(PORT, () => console .log('up and running http://localhost:'+PORT))




