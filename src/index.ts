import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { authRoutes } from "./auth";
import dotenv from 'dotenv';

dotenv.config();

const PORT : string | undefined = process.env.PORT ||  '443';
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.listen(PORT, () => console .log('up and running http://localhost:'+PORT))




