import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
  id: { type: mongoose.SchemaTypes.Number, required: true, unique: true},
  email: { type: mongoose.SchemaTypes.String, required: true, unique: true},
  password: { type: mongoose.SchemaTypes.String, required: true },
  username: { type: mongoose.SchemaTypes.String, required: true },
});

export const User = mongoose.model('User', userSchema);

