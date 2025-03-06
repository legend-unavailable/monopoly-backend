import express from 'express'
import { query, validationResult, checkSchema, matchedData, body } from 'express-validator';
import { User } from '../mongoose/schemas/user.js';

const router = express.Router();

const userDataValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    body('username').notEmpty().withMessage('Username is required')
];

router.post(('/signup'), express.json(), userDataValidation, async(req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
        return res.status(400).json({errs: errs.array});
    }

    const {email, password, username, password2} = req.body;
    console.log(`email: ${email}, password ${password}, username: ${username}`);

    const searchForEmailUser = async() => {
        try {
            const potenialUser = await User.findOne({email: email});
            if (potenialUser !== null) {
                return true;
            }
            return false;
        } catch (err) {
            console.log(`Err: ${err}`);
            throw err;
        }
    }
    if (await searchForEmailUser()) {
        return res.status(201).json({alreadyExists: true});
    }

    const lastUser = await User.findOne().sort({id: -1});
    let newID = 1;
    if (lastUser !== null) {
        newID = lastUser.id + 1;
    }
    const newUser = new User({id: newID, email: email, password: password, username: username});
    
    try {
        const savedUser = await newUser.save();
        return res.status(201).json({sucessful: true});
    } catch (err) {
        console.log(err);
        return res.status(400).json({sucessful: false});
        
    }

});

router.get(('/signup'), (req, res) => {
    return res.sendStatus(200);
})

export default router;