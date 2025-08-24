import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
    host: 'mysql',
    user: 'root',
    password: 'secret',
    database: 'barber',
    waitForConnections: true,
    port: 3306,
    connectionLimit: 10,
    connectTimeout: 5000,
    queueLimit: 0
});

async function connectWithRetry(retries = 10, delayMs = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const conn = await pool.getConnection();
            console.log("MySQL connected successfully");
            conn.release();
            return;
        } catch (err: any) {
            console.warn(`MySQL connection failed (attempt ${i+1}): ${err.message}`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    throw new Error("Could not connect to MySQL after multiple attempts");
}

connectWithRetry();
