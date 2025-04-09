import express from 'express'
import { Game } from '../mongoose/schemas/game.js';

const router = express.Router();

router.get('/rooms', async(req, res) => {
    try {
        const allRooms = await Game.find({status: 'waiting'}).select('name hostPlayerID players status password');
        const roomList = allRooms.map(room => ({
            id: room._id,
            name: room.name,
            hostUsername: room.players[0]?.username || 'Unknown host',
            playerCount: room.players.length,
            type: room.password ? 'private' : 'public'
        }));
        res.status(200).json({user: req.session.user, rooms: roomList});
    } catch (err) {
        console.log('Err fetching lobby info:', err);
        res.status(500).json({
            msg: 'Server err',
            err: err.message
        });
        
    }
});

export default router;