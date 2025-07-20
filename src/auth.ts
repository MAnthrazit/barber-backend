import { initDB } from "./db"; 
import { Router } from "express";
import  jwt  from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const SECRET : string | undefined = process.env.JWT_SECRET || 'fallback';
const router : Router = Router();

router.post('/login', async (req, res) => {
    const {username, password } = req.body;
    const db = await initDB();

    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [username]);

    if (!user || !(await bcrypt.compare(password, user.password))){
        return res.status(401).json({error: 'wrong email or password'});
    }

    const token = jwt.sign({id:user.id}, SECRET, {expiresIn: '1h'});
    res.json({ token: token });
    
});

export {router as authRoutes, SECRET};

