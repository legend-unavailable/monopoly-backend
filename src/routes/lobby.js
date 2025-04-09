import express from 'express';
import '../strats/local-strats.js';
import { Game } from '../mongoose/schemas/game.js';
import { Property } from '../mongoose/schemas/property.js';
import { User } from '../mongoose/schemas/user.js';



const router = express.Router();

const isAuthenticated = (req, res, next) => {
   if (req.session.visited && (req.session.user !== undefined)) {
      return next();
   }
   else res.status(401).json({authenticated: false});
}

 router.get('/lobby', isAuthenticated, (req, res) => {
    res.status(200).json({authenticated: true, user: req.session.user});
 })

 router.post('/lobby', express.json(),  isAuthenticated, async(req, res) => {
   try {
      const{hostID, hostUsername, roomType, roomName, roomPassword} = req.body;
      console.log(req.body);

      const findUser = await User.findById(hostID);
      console.log(findUser);
      

      const newGame = new Game({
         name: roomName || `${findUser.username}'s Game`,
         hostPlayerID: findUser._id,
         status: 'waiting',
         players: [{
            userID: findUser._id,
            username: findUser.username,
         }],
         password: roomPassword || null
      });

      const setProperties = await Property.find({});
      newGame.properties = setProperties.map(property => ({
         propertyID: property.id,
         ownerID: null,
         isMortgaged: false,
         amtOfHouses: 0,
         hasHotel: false,
         turnPurchased: null
      }));
      
      const savedGame = await newGame.save();

      req.io.emit('newGameCreated', {
         gameID: savedGame._id,
         gameName: savedGame.name,
         hastUsername: findUser.username
      });

      return res.status(201).json({
         msg: 'Game room created',
         game: {
            id: savedGame._id,
            name: savedGame.name,
            status: savedGame.status,
            players: savedGame.players.length,
            createdAt: Date.now(),
         }
      });
   } catch (err) {
      console.log('Err creating game: ', err);
      res.status(500).json({msg: 'Server Err', err: err.message})
      
   }
})

 router.patch('/lobby', express.json(), isAuthenticated, async(req, res) => {
   try {
      const{userID, username, roomID} = req.body;
      if (!roomID || !userID) {
         return res.status(400).json({
            success: false,
            msg: 'invalid req parameters'
         });
      }
      const room = await Game.findById(roomID);

      if (!room) {
         return res.status(404).json({
            success: false,
            msg: 'room not found' 
         });
      }
      room.players.map(player => {
         if (player.userID === userID) {
            return res.status(409).json({
               success: false,
               msg: 'player is already in this room'
            });
         }
      })
      room.players.push({userID: userID, username: username})
      await room.save();

      return res.status(200).json({
         success: true,
         msg: 'player added to room successfully',
         room: room
      });
   } catch (err) {
      console.log('server err: ', err);
      return res.status(500).json({
         success: false,
         msg: 'server err',
         err: err
      });
      
   }})

 export default router;