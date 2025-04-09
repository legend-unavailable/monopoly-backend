import mongoose from "mongoose";

const roomPlayerSchema = new mongoose.Schema({
    playerID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Player',
        required: true,
    },
    isReady: {type: Boolean, default: false},
    score: {type: Number, default: 372}

})