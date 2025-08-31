import { pool } from "./db"; 
import { Router } from "express";
import authenticateToken from "./authToken";

const router : Router = Router();
const pad = (n: number) => n.toString().padStart(2, '0');

const toMySQLDatetime = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`; // 1 based

router.get('/cuts', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();

    const today : Date = new Date();
    const dayStartStr = `${today.getFullYear()}-${pad(today.getMonth())}-${pad(today.getDate())} 00:00:00`;

    const [cuts] = await connection.query(
        `SELECT id, name, timestamp_start, timestamp_end, clients, state
        FROM events
        WHERE timestamp_start > ?`,
        [dayStartStr]
    );

    res.status(200).json(cuts);
})

router.get('/cuts/:date', async (req, res) => {
    const date = req.params.date;

    const connection = await pool.getConnection();

    const [year, month, day] = date.split('-').map(Number);


    const day_start = `${year}-${pad(month + 1)}-${pad(day)} 00:00:00`; 
    const day_end = `${year}-${pad(month + 1)}-${pad(day)} 23:59:59`;
    
    const [cuts] =  await connection.query(
        `SELECT id, timestamp_start, timestamp_end, clients, state FROM events 
        WHERE state = 1 AND timestamp_start BETWEEN ? AND ? ORDER BY timestamp_start`,
        [day_start, day_end]
    );

    console.log(day_start);
    console.log(day_end);

    res.status(200).json(cuts);
});


router.post('/cuts', async (req, res) => {
    const {name, email, timestamp_start, timestamp_end, clients, comment} = req.body;

    const connection = await pool.getConnection();
    
    const event_start = new Date(timestamp_start);
    const event_end = new Date(timestamp_end);

    const event_start_str : string = toMySQLDatetime(event_start);
    const event_end_str : string = toMySQLDatetime(event_end); 

    const day_start_str = `${event_start.getFullYear()}-${pad(event_start.getMonth())}-${pad(event_start.getDate())} 00:00:00`;
    const day_end_str = `${event_start.getFullYear()}-${pad(event_start.getMonth())}-${pad(event_start.getDate())} 23:59:59`;
    
    try {
    
        await connection.beginTransaction();
        const [overlap] = await connection.query(
            `SELECT * FROM events
            WHERE timestamp_start BETWEEN ? AND ?
            AND timestamp_start < ?
            AND timestamp_end > ?`,
            [
                day_start_str,
                day_end_str,
                event_end_str,
                event_start_str
            ]
        );    

        if ((overlap as any[]).length > 0){
            await connection.rollback();
            return res.status(409).json({ message: 'Overlapping appointment exists on this day.' });
        }

        await connection.query(
            `INSERT INTO events (name, email, timestamp_start, timestamp_end, clients, comment, state)
            VALUES(?,?,?,?,?,?,?)`,
            [
                name, 
                email, 
                event_start_str, 
                event_end_str, 
                clients, 
                comment, 
                0
            ]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Transaction failed:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        connection.release();
    }

    res.status(201).json({message: 'Event created successfully.'});
});

router.delete('/cuts/reject/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    const connection = await pool.getConnection();

    try {
        
        await connection.beginTransaction();
        await connection.query(`
            DELETE FROM events WHERE id = ?`,
            [id]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Transaction failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally{
        connection.release();
    }

    res.status(201).json({message: 'Event successfully deleted'});
});


router.post('/cuts/accept/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(`
            UPDATE events
            SET state = 1 WHERE id = ?`, 
            [id]
        );

        const [updatedCut] : any[] = await connection.query(`
            SELECT id, name, timestamp_start, timestamp_end, clients, state FROM events
            WHERE id = ?`, 
            [id]
        )
        await connection.commit();

        res.status(200).json(updatedCut[0]);
    } catch (error) {
        await connection.rollback();
        console.error('failed: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally{
        connection.release();
    }
});


export {router as eventRoutes};

