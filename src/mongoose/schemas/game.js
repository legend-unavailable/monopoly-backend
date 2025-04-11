import mongoose, { mongo } from "mongoose";

const propteryStateSchema = new mongoose.Schema({
    propertyID: {type: mongoose.SchemaTypes.Number, required: true},
    ownerID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null},
    isMortaged: {type: mongoose.SchemaTypes.Boolean, default: false},
    amtOfHouses: {type: mongoose.SchemaTypes.Int32, default: 0, min: 0, max: 4},
    hasHotel: {type: mongoose.SchemaTypes.Boolean, default: false},
    turnPurchased: {type: mongoose.SchemaTypes.Int32} 
});

const playerStateSchema = new mongoose.Schema({
    userID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true},
    username: {type: mongoose.SchemaTypes.String},
    mover: {type: mongoose.SchemaTypes.String},
    moverLevel: {type: mongoose.SchemaTypes.Int32, default: 1, min: 1, max: 5},
    balance: {type: mongoose.SchemaTypes.Int32, default: 372000},
    location: {type: mongoose.SchemaTypes.Int32, default: 0},
    inJail: {type: mongoose.SchemaTypes.Boolean, default: false},
    jailTurns: {type: mongoose.SchemaTypes.Int32, default: 0},
    hasJailCard: {type: mongoose.SchemaTypes.Boolean, default: false},
    turnOrder: {type: mongoose.SchemaTypes.Int32, default: 0},
    isBankrupt: {type: mongoose.SchemaTypes.Boolean, default: false},
    quitGameAt: {type: mongoose.SchemaTypes.Date, default: null},
    isReady: {type: mongoose.SchemaTypes.Boolean, default: false}
});

const transactionSchema = new mongoose.Schema({
    transactionType: {
        type: mongoose.SchemaTypes.String,
        enum: ['rent', 'purchase', 'salary', 'house', 'hotel', 'mortgage', 'unmortage', 'card', 'moverUpgrade']
    },
    playerID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
    recipientID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
    propertyID: {type: mongoose.SchemaTypes.Int32},
    amount: {type: mongoose.SchemaTypes.Int32},
    timeStamp: {type: mongoose.SchemaTypes.Date, default: Date.now}
});

const diceRollSchema = new mongoose.Schema({
    playerID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
    dice1: {type: mongoose.SchemaTypes.Number, min: 1, max: 6},
    dice2: {type: mongoose.SchemaTypes.Number, min: 1, max: 6},
    isDoubles: {type: mongoose.SchemaTypes.Boolean},
    turnNumber: {type: mongoose.SchemaTypes.Number},
    timeStamp: {type: mongoose.SchemaTypes.Date, default: Date.now}
});

const gameSchema = new mongoose.Schema({
    name: {type: mongoose.SchemaTypes.String, required: true},
    startTime: {type: mongoose.SchemaTypes.Date, default: Date.now},
    endTime: {type: mongoose.SchemaTypes.Date, default: Date.now},
    password: {type: mongoose.SchemaTypes.String, default: null},
    status: {
        type: mongoose.SchemaTypes.String,
        enum: ['waiting','active', 'completed', 'abandoned'],
        default: 'waiting'
    },
    winnerPlayerID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null},
    turnCounter: {type: mongoose.SchemaTypes.Number, default: 0},
    players: [playerStateSchema],
    properties: [propteryStateSchema],
    transactions: [transactionSchema],
    diceRolls: [diceRollSchema],
    hostPlayerID: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true},
})

export const Game = mongoose.model('Game', gameSchema);