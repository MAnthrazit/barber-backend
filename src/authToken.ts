import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import path from "node:path";

dotenv.config({ path: path.resolve('/data/.env') });
const SECRET : string = process.env.JWT_SECRET || 'fallback';

function authenticateToken(req : any, res : any, next : any) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        res.sendStatus(403);
    }
}

export default authenticateToken;

