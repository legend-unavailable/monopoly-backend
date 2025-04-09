import mongoose, { mongo } from "mongoose";

const cardSchema = new mongoose.Schema({
    id: {type: mongoose.SchemaTypes.Number, required: true, unique: true},
    type: {type: mongoose.SchemaTypes.String, enum: ['black', 'golden', 'orange'], required: true},
    fortuneTitle: {type: mongoose.SchemaTypes.String},
    description: {type: mongoose.SchemaTypes.String, requierd: true},
    actionType: {
        type: mongoose.SchemaTypes.String,
        enum: ['move', 'collect', 'pay', 'jail', 'getoutofjail', 'moveto']
    },
    valueByLevels: [mongoose.SchemaTypes.Number],
    actionValue: {type: mongoose.SchemaTypes.Mixed}
});

export const Card = mongoose.model('Card', cardSchema);