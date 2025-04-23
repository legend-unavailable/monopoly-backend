import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
    id: {type: mongoose.SchemaTypes.Number, required: true, unique: true},
    name: {type: mongoose.SchemaTypes.String, required: true},
    color: {
        type: mongoose.SchemaTypes.String, 
        required: true,
        enum: ['Brown', 'Blue', 'Pink', 'Orange', 'Red', 'Yellow', 'Green', 'Purple']
    },
    position: {type: mongoose.SchemaTypes.Number, required: true, unique: true},
    priceTag: {type: mongoose.SchemaTypes.Number},
    mortgageValue: {type: mongoose.SchemaTypes.Number},
    baseRent: {type: mongoose.SchemaTypes.Number},
    rentWithHouses: [mongoose.SchemaTypes.Number],
    rentWithHotel: {type: mongoose.SchemaTypes.Number},
    houseCost: {type: mongoose.SchemaTypes.Number},
    hotelCost: {type: mongoose.SchemaTypes.Number},
    fortuneExists: {type: mongoose.SchemaTypes.Boolean},
    imageKey: {type: mongoose.SchemaTypes.String}
});

export const Property = mongoose.model('Property', propertySchema);