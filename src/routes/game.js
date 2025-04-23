import express from 'express'
import { Game } from '../mongoose/schemas/game.js';
import { Property } from '../mongoose/schemas/property.js';

const router = express.Router();

router.get('/game', async(req, res) => {
    const gameID = req.query.gameID;
    try {
        if (!gameID) {
            return res.status(400).json({err: 'Game ID not found in session'});
        }
        const game = await Game.findById(gameID);
        if (!game) {
            return res.status(404).json({error: 'Game not found'});
        }
        const properties = await Property.find({}).lean();
        if (!properties) {
            return res.status(404).json({error: 'Game not found'});
        }
        const propertyMap = new Map(properties.map(p => [p.id, p]));
        const finalProps = game.properties.map(propState => {
            const pState = propState.toObject();
            const base = propertyMap.get(propState.propertyID) || {};
            console.log(base);
            
            return {
                ...pState,
                ...base
            };
        });        
        res.json({players: game.players, properties: finalProps});
    } catch (err) {
        console.log('Failed to fetch game:', err);
        res.status(500).json({err: 'internal server err'});
    }
});

export default router;