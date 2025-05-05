import { Game } from "./mongoose/schemas/game.js";
import { Property } from "./mongoose/schemas/property.js";
import { User } from "./mongoose/schemas/user.js";

const userSocketMap = {}

const gameSocket = (io) => {
    io.on('connection', (socket) => {
        socket.on('createGameRoom', async(data) => {
            const {hostID, hostUsername, roomName, roomPassword} = data;
            try {
                const findUser = await User.findById(hostID);
                if (!findUser) {
                    socket.emit('createGameError', {msg: 'User not found'});
                    return;
                }
                const newGame = new Game({
                    name: roomName || `${findUser.username}'s Game`,
                    hostPlayerID: findUser._id,
                    status: 'waiting',
                    players: [{
                        userID: findUser._id,
                        username: findUser.username
                    }],
                    password: roomPassword
                });
                const savedGame = await newGame.save();
                socket.join(savedGame._id.toString());
                socket.emit('gameCreated', {
                    gameID: savedGame._id,
                    gameName: savedGame.name,
                    players: savedGame.players
                });
                io.emit('newGameAvailable', {
                    gameID: savedGame._id,
                    gameName: savedGame.name,
                    hostUsername: findUser.username,
                    playerCount: 1
                });
            } catch (err) {
                socket.emit('createGameError', {
                    msg: 'err creating game',
                    err: err.message
                });
            }
        });

        socket.on('joinGameRoom', async(data) => {
            const {gameID, userID, username} = data;
            userSocketMap[userID] = socket.id;
            try {
                const game = await Game.findById(gameID);
                if (!game) {
                    socket.emit('joinGameError', {msg: 'Game not found'});
                    return;
                }
                await socket.join(gameID);
                const isUserInGame = game.players.some(
                    player => player.userID.toString() === userID.toString()
                );

                if (!isUserInGame) {
                    game.players.push({userID: userID, username: username});
                    await game.save();
                }
                const updatedGame = await Game.findById(gameID);
                io.to(gameID).emit('playersUpdated', {gameID, players: updatedGame.players});
                socket.emit('gameJoined', {
                    gameID,
                    players: updatedGame.players,
                    gameName: updatedGame.name,
                    hostPlayerID: updatedGame.hostPlayerID
                });
                io.emit('gameUpdated', {gameID: updatedGame._id, playerCount: updatedGame.players.length})
            } catch (err) {
                socket.emit('joinGameErr', {
                    msg: 'Err joining game',
                    err: err.msg
                });
            }
        });

        socket.on('playerReady', async(data) => {
            const {gameID, userID, isReady, mover} = data;
            try {
                const game = await Game.findById(gameID);
                if (!game) {
                    socket.emit('readyErr', {msg: 'game not found'});
                    return;
                }
                const playerIndex = game.players.findIndex(player => 
                    player.userID.toString() === userID.toString()
                );
                if (playerIndex !== -1) {
                    const isMoverTaken = game.players.some(player => 
                        player.mover === mover && player.userID.toString() !== userID.toString()
                    );
                    if (isMoverTaken) {
                        socket.emit('readyErr', {msg: 'Mover already taken'});
                        return;
                    }
                    game.players[playerIndex].isReady = isReady;
                    game.players[playerIndex].mover = mover;
                    await game.save();
                    io.to(gameID).emit('playerStatusUpdated', {
                        userID,
                        isReady,
                        players: game.players,
                        mover
                    });
                    const allReady = game.players.every(player => player.isReady);
                    if (allReady && game.players.length >= 2) {
                        io.to(gameID).emit('allPlayersReady', {gameID});
                    }
                }
            } catch (err) {
                socket.emit('readyErr', {
                    msg: 'err updating ready status',
                    err: err.message
                });
            }
        });

        socket.on('leaveGameRoom', async(data) => {
            const{gameID, userID} = data;
            for (const [id, sid] of Object.entries(userSocketMap)) {
                if (sid === socket.id) {
                    delete userSocketMap[id];
                    break;
                }
            }
            try {
                socket.leave(gameID);
                const game = await Game.findById(gameID);
                if (!game) {return;}
                game.players = game.players.filter(player => 
                    player.userID.toString() !== userID.toString()
                );                
                if (game.hostPlayerID.toString() === userID.toString()) {                
                    if (game.players.length > 0) {
                        game.hostPlayerID = game.players[0].userID;
                        io.to(gameID).emit('newHostAssigned', {
                            gameID,
                            newHostID: game.hostPlayerID,
                            newHostUsername: game.players[0].username
                        });
                    } else {
                        await Game.findByIdAndDelete(gameID);
                        io.emit('gameRemoved', {gameID});
                        return;
                    }
                }
                await game.save();
                io.to(gameID).emit('playerLeft', {
                    userID, gameID, players: game.players
                });
                io.emit('gameUpdated', {
                    gameID: game._id,
                    playerCount: game.players.length
                });
            } catch (err) {
                console.log('err leaving game', err);
            }
        });

        socket.on('getAvailableGames', async() => {
            try {
                const games = await Game.find({status: 'waiting'});
                const gamesList = games.map(game => ({
                    gameID: game._id,
                    gameName: game.name,
                    hostUsername: game.players.find(player => {
                        player.userID.toString() === game.hostPlayerID.toString();
                    })?.username,
                    playerCount: game.players.length,
                    hasPassword: !game.password
                }));
                socket.emit('availableGames', {games: gamesList});
            } catch (err) {
                socket.emit('gamesListError', {msg: 'err fetching games'});
            }
        });

        /*socket.on('sendChatMsg', (data) => {
            const {gameID, userID, username, msg} = data;
            io.to(gameID).emit('chatMsg', {
                userID, username, msg, timeStamp: new Date()
            });
        });*/

        socket.on('startGame', async(data) => {
            const {gameID, hostID} = data;
            try {
                
                const game = await Game.findById(gameID);                
                if (!game) {
                    socket.emit('startGameErr', {msg: 'game not found'});
                    return;
                }
                if (game.hostPlayerID.toString() !== hostID.toString()) {
                    socket.emit('startGameErr', {msg: 'only the host can start the game'});
                    return;
                }
                if (game.players.length < 2) {
                    socket.emit('gameStartErr', {msg: 'need at least 2 players'});
                    return;
                }
                game.status = 'active';
                await game.save();
                console.log('broadcasting gamestarted to room:', gameID);
                io.to(gameID).emit('gameStarted', {
                    gameID, players: game.players, userID: hostID
                });
                io.emit('gameRemoved', {gameID});               
            } catch (err) {
                console.log(err);
                
                socket.emit('startGameErr', {
                    msg: 'err starting game'
                });
            }
        });

        socket.on('rollDice', async(data) => {
            
            const {gameID, userID, phase} = data;
            try {
                const dice = [roll(), roll()];
                const isDoubles = dice[0] === dice[1];
                const game = await Game.findById(gameID);
                if (!game) {
                    socket.emit('rollDiceErr', {msg: 'game not found'});
                    return;
                }
                const rollEntry = {
                    playerID: userID,
                    dice1: dice[0],
                    dice2: dice[1],
                    isDoubles,
                    turnNumber: game.turnCounter,
                }
                game.diceRolls.push(rollEntry);
                if (phase === 'turnOrder') {
                    const firstRolls = game.players.map(player => {
                        return game.diceRolls.find(roll => roll.playerID.toString() === player._id.toString());
                    }).filter(Boolean);
                    if (firstRolls.length === game.players.length) {
                        const order = firstRolls.map(roll => ({
                            playerID: roll.playerID,
                            total: roll.dice1 + roll.dice2
                        })).sort((a, b) => b.total - a.total);
                        order.forEach((entry, index) => {
                            const player = game.players.find(p => p._id.toString() === entry.playerID.toString());
                            if(player) player.turnOrder = index;
                        });
                        await game.save();
                        io.to(gameID).emit('turnOrderFinalized', {
                            order: game.players.map(p => ({
                                playerID: p._id,
                                turnOrder: p.turnOrder
                            }))
                        });
                    } else {await game.save();}
                } else {await game.save();}
                const me = game.players.find(p => p.userID.toString() === userID.toString());
                console.log('me', me);
                
                io.to(gameID).emit('diceRolled', {me, dice, isDoubles, phase,});
            } catch (err) {
                console.log("Err rolling dice:", err);
                socket.emit('rollDiceErr', {msg: 'server err'});                
            }
        });
        const roll = () => {
            return Math.ceil(Math.random() * 6);
        }

        socket.on('sendChatMsg', async (data) => {
            const {gameID, sender, receiver, msg} = data;
            
            if (!gameID || !sender || !msg) {
                return socket.emit('chatMsgErr', {msg: 'Invalid chat data'});
            }
            const payload = {
                sender, receiver, msg, gameID
            };
            if (receiver == 'all') {                
                io.to(gameID).emit('chatMsg', payload);
            }
            else {
                await Game.findById(gameID).then(game => {
                    const target = game.players.find(p => p.username === receiver);
                    if (target) {
                        
                        const targetSocketID = userSocketMap[target.userID];
                        if (targetSocketID) {
                            io.to(targetSocketID).emit('chatMsg', payload);
                        }
                    }
                });
            }
            
        });

        socket.on('propertyPurchased', async(data) => {
            const {gameID, userID, propertyID} = data;
            try {
                const game = await Game.findById(gameID);
                const player = game.players.find(p => p.userID.toString() === userID.toString());
                const property = game.properties.find(p => p.propertyID === propertyID);
                
                
                
                if (!player || !property) return;
                const propertyDetails = await Property.findOne({id: propertyID});
                
                
                if (!propertyDetails) return;
                const alreadyOwned = property.ownerID !== null;
                const canAfford = player.balance >= propertyDetails.priceTag;
                
                
                if (!alreadyOwned && canAfford) {
                    player.balance -= propertyDetails.priceTag;
                    property.ownerID = userID;
                    player.location = propertyDetails.position;
                    await game.save();
                    
                    io.to(gameID).emit('propertyPurchaseUpdate', {
                        userID, 
                        propertyID,
                        newBalance: player.balance,
                        players: game.players,
                        
                    });
                } else {
                    socket.emit('propertyPurchaseFailed', {
                        reason: alreadyOwned ? 'Property already owned' : 'insufficient balance'
                    });
                }
            } catch (err) {
                console.log('err processing property purchase', err);
                socket.emit('propertyPurchaseFailed', {reason: 'internal server err'});
            };
        });

        socket.on('turnChange', (data) => {
            const {gameID, nextPlayerID} = data;
            io.to(gameID).emit('turnChanged', nextPlayerID);
        })

        socket.on('updateLoc', async(data) => {
            const {gameID, userID, newPos, player} = data;
            const game = await Game.findById(gameID);
            const me = game.players.find(p => p.userID.toString() === userID.toString());
            const newPlayer = player.find(p => p.userID === userID);
            const type = ((newPos - me.location) < 2 || (newPos - me.location) > 12) ?
            null : `rolled ${newPos - me.location}`;
            me.moverLevel = newPlayer.moverLevel;
            me.balance = newPlayer.balance;
            me.location = newPos;
            me.inJail = newPlayer.inJail;
            me.jailTurns = newPlayer.jailTurns;
            me.hasJailCard = newPlayer.hasJailCard;
            me.turnOrder = newPlayer.turnOrder;
            me.isBankrupt = newPlayer.isBankrupt; 
            me.fortunes = newPlayer.fortunes;
            await game.save();
            io.to(gameID).emit('updatedLoc', {updatedPlayers: game.players, type, player: me});
        });

        socket.on('transferMoney', async(data) => {
            const {payer, owner, amt, gameID} = data;
            const game = await Game.findById(gameID);
            const serverPayer = game.players.find(p => p.userID.toString() === payer.userID.toString());
            const serverOwner = game.players.find(p => p.userID.toString() === owner.userID.toString());
            serverPayer.balance -= amt;
            serverOwner.balance += amt;
            await game.save();
            io.to(gameID).emit('updatedLoc', {updatedPlayers: game.players, type: `has paid $${amt} in rent to ${owner.username}`, player: payer});
        });

        socket.on('updateJail', async(data) => {
            const {me, gameID, state} = data;
            const game = await Game.findById(gameID);
            const player = game.players.find(p => p.userID.toString() === me.userID.toString());
            let type = '';
            if (state === 'free' || state === 'free1') {
                type = state === 'free1' ?
                "couldn't escape in time and paid the bail" :
                'escaped jail';                
                player.inJail = false;
                player.jailTurns = 0;
            }
            else if(state === 'update') {
                player.jailTurns = player.jailTurns + 1;
                type = "couldn't escape jail"
            }
            else if(state === 'bribe') {
                type = 'bribed the guard and escaped'
                player.inJail = false;
                player.jailTurns = 0;
                player.balance -= 50000;
                player.location = 8;
            }
            console.log(player.jailTurns);
            
            await game.save();
            io.to(gameID).emit('updatedLoc', { updatedPlayers: game.players, type, player});
        });

        socket.on('card', async(data) => {
            console.log('daten', data);
            let type = null;
            
            const {gameID, userID,  val, card, otherPlayer = null} = data;
            const game = await Game.findById(gameID);
            const player = game.players.find(p => p.userID.toString() === userID.toString());
            if (card.actionType === 'collect') {
                if (card.actionValue === 'upgrade') {
                    player.moverLevel === 5 ? val += 50000 : player.moverLevel += 2;
                    player.balance += val;
                }
                else if (card.actionValue === 'takeAll') {
                    let money = 0;
                    if (card.type !== 'fortune') {
                        game.players.map(p => {
                            if (p.userID.toString() !== userID.toString()) {
                                if (p.moverLevel === 1) {
                                    
                                    const amt = card.valueByLevels[0];
                                    p.balance -= amt;
                                    money += amt;
                                }
                                else if (p.moverLevel === 3) {
                                    const amt = card.valueByLevels[1];
                                    p.balance -= amt;
                                    money += amt;
                                }
                                else {
                                    const amt = card.valueByLevels[2];
                                    p.balance -= amt;
                                    money += amt;
                                }
                            }
                        })
                        player.balance += money;
                    }
                    else {
                        game.players.map(p => 
                            p.userID.toString() !== userID.toString() ?
                            p.balance -= val :
                            p.balance += (val * (game.players.length - 1))
                        );
                    }
                }
                else if (card.actionValue === 'non') {
                    player.balance += val;
                }
                else if (card.actionValue === 'takeOne') {
                    game.players.map(p => {
                        if (p.userID.toString() === userID.toString()) {
                            p.balance += val;
                            return;
                        }
                        else if (p.userID.toString() === otherPlayer.toString()) {
                            p.balance -= val;
                            return;
                        }
                        else return;
                    });
                }
            }
            else if (card.actionType === 'moveTo'){
                if (card.actionValue === 'five') {
                    player.balance -= val;
                }
            }
            else if (card.actionType === 'getoutofjail') {
                player.hasJailCard = true;
            }
            else if (card.actionType === 'pay') {
                if (card.actionValue === 'giveAll') {
                    game.players.map(p => 
                        p.userID.toString() === userID.toString() ?
                        p.balance -= (val * (game.players.length - 1)) :
                        p.balance += val
                    );
                }
                else if (card.actionValue === 'giveOne') {
                    game.players.map(p => {
                        if (p.userID.toString() === userID.toString()) {
                            p.balance -= val;
                            return;
                        }
                        else if (p.userID.toString() === otherPlayer.toString()) {
                            p.balance += val;
                            return;
                        }
                        else return;
                    });
                }
                else if (card.actionValue === 'non') {
                    player.balance -= val;
                }
            }
            else if (card.actionType === 'roll') {
                player.balance += val;
                type = 'rolled and won';
            }
            else if (card.actionType === 'downgrade') {
                player.moverLevel -= 2;
            }
            await game.save();
            io.to(gameID).emit('updatedLoc',{updatedPlayers: game.players, type, player});
        });

        socket.on('removal', async(data) => {
            const {gameID, cards, type} = data;
            cards.shift();
            if (type === 'fo') {
                console.log('fo', cards.length);
                
            }
            io.to(gameID).emit('setCard', {cards, type});
        });

        socket.on('removeF', async(data) => {
            const {gameID, property, fortunes} = data;
            
            io.to(gameID).emit('deleteFortune', {property, fortunes});

        });
        socket.on('gameOver', (data) => {
            const {gameID} = data;
            console.log('in server');
            
            io.to(gameID).emit('gameEnd', gameID);
        })

        socket.on('mortage', async(data) => {
            const {gameID, property, price} = data;
            const game = await Game.findById(gameID);
            const player = game.players.find(p => p.userID.toString() === property.ownerID.toString());
            player.balance += property.mortgageValue + price;
            await game.save();
            io.to(gameID).emit('mortgaged', {property, players: game.players});

        })

        
        socket.on('disconnect', () => {});
    });
};
export default gameSocket;