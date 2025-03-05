import express from 'express';
import {query, validationResult, checkSchema, matchedData, body} from 'express-validator';
import { User } from '../mongoose/schemas/user.js';
import { request } from 'https';
import '../strats/local-strats.js'
import passport from 'passport';

const router = express.Router();

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

router.post(('/login'), (req, res, next) => {
    /*note to self: add code that checks if data is valid*/    
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
        return res.status(400).json({errors: errs.array});
    }

    passport.authenticate('local', (err, user) => {
        if(err) return next(err);
        if(!user) return res.status(401).json({error: 'Invalid email or password'});

        req.logIn(user, (err) => {
            if(err) return next(err);
            req.session.userID = user.id;
            req.session.username = user.username;
            req.session.visited = true;
            return res.status(200).json({isFound: true});
        });

    })(req, res, next);
});

// router.get("/Login", (req, res) => {
//   return res.sendStatus(200);
// });
 
export default router;