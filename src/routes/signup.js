import express from 'express'
import { query, validationResult, checkSchema, matchedData } from 'express-validator';
import { User } from '../mongoose/schemas/user.js';

const router = express.Router();
router.post(('/Signup'), express.json(), async(req, res) => {
    const {email, password, firstName, lastName, username} = req.body;
    console.log(`email: ${email}, password ${password}, first name: ${firstName}, last name: ${lastName}, username: ${username}`);
    
    const lastUser = User.findOne().sort({id: -1});lastUser.id
    const newUser = new User({id: 1, email: email, password: password, firstName: firstName, lastName: lastName, username: username});
    
    try {
        const savedUser = await newUser.save();
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.sendStatus(400);
        
    }

});

router.get(('/Signup'), (req, res) => {
    return res.sendStatus(200);
})

export default router;