import mongoose, { mongo } from "mongoose";

export const cardSchema = new mongoose.Schema({
    type: {type: mongoose.SchemaTypes.String, enum: ['chance', 'lifestyle', 'fortune'], required: true},
    fortuneTitle: {type: mongoose.SchemaTypes.String},
    description: {type: mongoose.SchemaTypes.String, required: true},
    actionType: {
        type: mongoose.SchemaTypes.String,
        enum: ['move', 'collect', 'pay', 'jail', 'getoutofjail', 'moveto', 'roll', 'downgrade', 'house', 'buy', 'no', 'pick']
    },
    valueByLevels: [mongoose.SchemaTypes.Number],
    actionValue: {type: mongoose.SchemaTypes.Mixed}
}, {_id: false});

export const Card = mongoose.model('Card', cardSchema);