import { pool } from "./db"; 
import { Router } from "express";
import authenticateToken from "./authToken";

const router : Router = Router();

const pad = (n: number) => n.toString().padStart(2, '0');
const toMySQLDatetime = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`; // 1 based

router.get('/holidays',  async (req, res) => {
    const today : Date = new Date();
    const dayStartStr = `${today.getFullYear()}-${pad(today.getMonth())}-${pad(today.getDate())} 00:00:00`;
    

    const connection = await pool.getConnection();
    try {
        const [holidays] = await connection.query(
            `SELECT id, timestamp_start, timestamp_end
            FROM holidays
            WHERE timestamp_end >= ?`,
                [dayStartStr]
        );

        res.status(200).json(holidays);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
})


router.post('/holidays', authenticateToken, async (req, res) => {
    const {timestamp_start, timestamp_end} = req.body;

    if (!timestamp_start || !timestamp_end) {
        return res.status(400).json({ message: 'Both start and end timestamps are required.' });
    }

    const holiday_start = new Date(timestamp_start);
    const holiday_end = new Date(timestamp_end);

    if (isNaN(holiday_start.getTime()) || isNaN(holiday_end.getTime())) {
        return res.status(400).json({ message: 'Invalid date format.' });
    }

    const holiday_start_str : string = toMySQLDatetime(holiday_start);
    const holiday_end_str : string = toMySQLDatetime(holiday_end); 

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        const [holiday] = await connection.query(
            `INSERT into holidays (timestamp_start, timestamp_end)
            VALUES(?,?)`, 
            [holiday_start_str, holiday_end_str]
        )
        
        await connection.commit();
        res.status(201).json({ message: 'Holiday created successfully.', id: (holiday as any).insertId});
    } catch (error) {
        await connection.rollback();
        console.error('Transaction failed:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        connection.release();
    }
})

router.delete('/holidays/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    const connection = await pool.getConnection();

    try {
        
        await connection.beginTransaction();
        const [holiday] = await connection.query(`
            DELETE FROM holidays WHERE id = ?`,
            [id]
        );

        if ((holiday as any).affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Holiday not found' });
        }
        await connection.commit();
        return res.status(200).json({ message: 'Holiday successfully deleted' });
    } catch (error) {
        await connection.rollback();
        console.error('Transaction failed', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally{
        connection.release();
    }
});

export {router as holidayRoutes};
