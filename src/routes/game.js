import express from 'express'
import { Game } from '../mongoose/schemas/game.js';
import { Property } from '../mongoose/schemas/property.js';
import { Card } from "../mongoose/schemas/card.js";

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
            
            return {
                ...pState,
                ...base
            };
        });
        const cards = await Card.find({}).lean();
        const chances = cards.filter(c => c.type === 'chance');
        const lifestyles = cards.filter(c => c.type === 'lifestyle'); 
        const fortunes = cards.filter(c => c.type === 'fortune'); 
        console.log('fortunes', fortunes);
        const fo = shuffle(fortunes);
        console.log('g', fo);
        
        
        
              
        res.json({players: game.players, properties: finalProps, chances: shuffle(chances), lifestyles: shuffle(lifestyles), fortunes: shuffle(fortunes)});
    } catch (err) {
        console.log('Failed to fetch game:', err);
        res.status(500).json({err: 'internal server err'});
    }
});

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[1], arr[j] = arr[j], arr[i]]
    }
    return arr;
}

export default router;