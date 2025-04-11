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
        })

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
            const {gameID, userID, isReady} = data;
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
                    game.players[playerIndex].isReady = isReady;
                    await game.save();
                    io.to(gameID).emit('playerStatusUpdated', {
                        userID,
                        isReady,
                        players: game.players
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
        })

        socket.on('leaveGameRoom', async(data) => {
            const{gameID, userID} = data;
            try {
                socket.leave(gameID);
                const game = await Game.findById(gameID);
                if (!game) {return;}
                game.players = game.players.filter(player => 
                    player.userID.toString() !== userID.toString()
                );
                if (game.hostPlayerID.toString === userID.toString()) {
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
                        player.userID.toString() === game,hostPlayerID.toString();
                    })?.username,
                    playerCount: game.players.length,
                    hasPassword: !game.password
                }));
                socket.emit('availableGames', {games: gamesList});
            } catch (err) {
                socket.emit('gamesListError', {msg: 'err fetching games'});
            }

            socket.on('sendChatmsg', (data) => {
                const {gameID, userID, username, msg} = data;
                io.to(gameID).emit('chatMsg', {
                    userID, username, msg, timeStamp: new Date()
                });
            })
            
            socket.on('startGame', async(data) => {
                const {gameID, hostID} = data;
                try {
                    const game = await Game.findById(gameID);
                    if (!game) {
                        socket.emit('startGameErr', {msg: 'game not found'});
                        return;
                    }
                    if (game.hostPlayerID.toString() !== hostID.toSring()) {
                        socket.emit('startGameErr', {msg: 'only the host can start the game'});
                        return;
                    }
                    if (game.players.length < 2) {
                        socket.emit('startGameErr', {msg: 'need at least 2 players'});
                        return;
                    }
                    game.status = 'playing';
                    await game.save();
                    io.to(gameID).emit('gameStarted', {
                        gameID, players: game.players
                    });
                    io.emit('gameRemoved', {gameID});
                } catch (err) {
                    socket.emit('startGameErr', {
                        msg: 'err starting game',
                        err: err.message
                    });
                }
            });

            socket.on('disconnect', () => {

            });
        })
    })
}
export default gameSocket;