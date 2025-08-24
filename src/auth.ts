import { pool } from "./db"; 
import { Router } from "express";
import  jwt  from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import authenticateToken from "./authToken";
import path  from "node:path";

dotenv.config({ path: path.resolve('/data/.env') });
const SECRET : string = process.env.JWT_SECRET || 'fallback';
const router : Router = Router();

router.post('/register', async (req, res) => {
    const {name, email, password } = req.body;
    const connection = await pool.getConnection();

    const encPassword : string = bcrypt.hashSync(password, 10);
    
    await connection.beginTransaction();

    try {
        await connection.query(
            `
            INSERT INTO users (name, email, password)
            VALUES(?, ?, ?)
            `, 
            [
                name, 
                email, 
                encPassword
            ]
        )
        
        await connection.commit();
        res.status(200).json({ message: 'registered successfully' });
    } catch (err : any) {
        await connection.rollback();
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
})

router.post('/login', async (req, res) => {
    const {username, password } = req.body;

    const connection = await pool.getConnection();
    
    try{
        const [rows] = await connection.query<any[]>(
            `
            SELECT * FROM users WHERE email = ?
            `, 
            [ username]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
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

        res.status(200).json({ token });
    } catch (err: any) {
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});

router.get('/auth-check', authenticateToken, (req, res) => {
    res.status(200).json({ authenticated: true });
});
 
export {router as authRoutes};

