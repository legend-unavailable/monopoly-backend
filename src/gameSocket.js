import { Game } from "./mongoose/schemas/game.js";
import { User } from "./mongoose/schemas/user.js";

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

        socket.on('sendChatMsg', (data) => {
            const {gameID, userID, username, msg} = data;
            io.to(gameID).emit('chatMsg', {
                userID, username, msg, timeStamp: new Date()
            });
        });

        socket.on('startGame', async(data) => {
            const {gameID, hostID} = data;
            try {
                console.log('startgame received', data);
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
            console.log(data);
            
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
                        })).sort((a, b) => b.total = a.total);
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
                io.to(gameID).emit('diceRolled', {userID, dice, isDoubles, phase});
            } catch (err) {
                console.log("Err rolling dice:", err);
                socket.emit('rollDiceErr', {msg: 'server err'});                
            }
        });
        const roll = () => {
            return Math.ceil(Math.random() * 6);
        }
        
        socket.on('disconnect', () => {});
    });
};
export default gameSocket;