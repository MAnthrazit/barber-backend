import { initDB } from "./db";

(async () => {
    const db = await initDB();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        );
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            timestanp TEXT,
            duration INTEGER,
            count INTEGER,
            comment TEXT,
            state INTEGER
        );
    `);
    console.log('Tables created');
})();
