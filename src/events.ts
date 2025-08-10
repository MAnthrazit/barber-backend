import { initDB } from "./db"; 
import { Router } from "express";
import authenticateToken from "./authToken";

const router : Router = Router();

router.get('/cuts', authenticateToken, async (req, res) => {
    const db = await initDB();
    const today : Date = new Date();
    
    const day_start : Date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);


    const cuts =  await db.all(
        `SELECT id, name, timestamp_start, timestamp_end, clients, state FROM events 
        WHERE timestamp_start > ? `,
        [day_start.toISOString()]
    );

    res.status(200).json(cuts);
})

router.get('/cuts/:date', async (req, res) => {
    const db = await initDB();
    const date = req.params.date;

    const [year, month, day] = date.split('-').map(Number);

    const day_start = new Date(year, month - 1, day, 0, 0, 0);
    const day_end = new Date(year, month - 1, day, 23, 59, 59);

    const cuts =  await db.all(
        `SELECT id, timestamp_start, timestamp_end, clients, state FROM events 
        WHERE state = 1 AND timestamp_start BETWEEN ? AND ? ORDER BY timestamp_start`,
        [day_start.toISOString(), day_end.toISOString()]
    );

    console.log(day_start.toISOString());
    console.log(day_end.toISOString());

    res.status(200).json(cuts);
});


router.post('/cuts', async (req, res) => {
    const {name, email, timestamp_start, timestamp_end, clients, comment} = req.body;
    const db = await initDB();

    const event_start = new Date(timestamp_start);
    const event_end = new Date(timestamp_end);

    const day_start = new Date(event_start.getFullYear(), event_start.getMonth(), event_start.getDate(), 0, 0, 0);
    const day_end = new Date(event_start.getFullYear(), event_start.getMonth(), event_start.getDate(), 23, 59, 59);


    const overlap = await db.all(
        `SELECT * FROM events
        WHERE timestamp_start BETWEEN ? AND ?
        AND datetime(timestamp_start) < ?
        AND datetime(timestamp_end) > ?`,
        [
            day_start.toISOString(),
            day_end.toISOString(),
            event_end.toISOString(),
            event_start.toISOString()
        ]
    );    

    if (overlap.length > 0){
        return res.status(409).json({ message: 'Overlapping appointment exists on this day.' });
    }

    await db.run(
        `INSERT INTO events (name, email, timestamp_start, timestamp_end, clients, comment, state)
         VALUES(?,?,?,?,?,?,?)`,
         [name, email, timestamp_start, timestamp_end, clients, comment, 0]
    );


    res.status(201).json({message: 'Event created successfully.'});


});

export {router as eventRoutes};

