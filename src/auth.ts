import { initDB } from "./db"; 
import { Router } from "express";
import  jwt  from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import authenticateToken from "./authToken";
import { resolve } from "node:path";

dotenv.config();
const SECRET : string = process.env.JWT_SECRET || 'fallback';
const router : Router = Router();

router.post('/register', async (req, res) => {
    const {name, email, password } = req.body;
    const db = await initDB();

    const encPassword : string = bcrypt.hashSync(password, 10);

    try {

        await db.run(`
            INSERT INTO users (name, email, password)
            VALUES(?, ?, ?)`, 
            [name, email, encPassword]
        )

        res.status(200).json({ message: 'registered successfully' });
    } catch (err : any) {
        res.sendStatus(500);
    }
})

router.post('/login', async (req, res) => {
    const {username, password } = req.body;
    const db = await initDB();

    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [username]);

    if (!user || !(await bcrypt.compare(password, user.password))){
        return res.status(401).json({error: 'wrong email or password'});
    }

    const now  : number = Math.floor(Date.now() / 1000);
    const exp : number = now + 60 * 60 * 2;


    const claims = {
        'sub': user.id,
        'iat': now,
        'exp': exp,
    };

    const token = jwt.sign(
        claims,
        SECRET, 
        { algorithm: 'HS256' },
    );

    return res.status(200).json({ token: token });
});

router.get('/auth-check', authenticateToken, (req, res) => {
    res.status(200).json({ authenticated: true });
});
 
export {router as authRoutes};

