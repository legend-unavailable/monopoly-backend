import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../mongoose/schemas/user.js";
import bcrypt from 'bcrypt';

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const result = await User.findById(id);
        if (!result) {
            console.log("user not found");
            return done(null, false);
            
        }
        done(null, result);
    } catch (error) {
        done(error, null);
    }
})

export default passport.use(
    new Strategy({usernameField: 'email'}, async (email, password, done) => {
        try {
            const findUser = await User.findOne({email});
            if (!findUser) {
                console.log('User not found');
                return done(null, false, {msg: 'Incorrect email'});
            }
            const isMatch = await bcrypt.compare(passport, findUser.password);
            if (!isMatch) {
                console.log('Incorrect password');
                return done(null, false, {msg: 'incorrect password'});;
            }
            done(null, findUser);
        } catch (error) {
            done(error, null);
        }
    })
)