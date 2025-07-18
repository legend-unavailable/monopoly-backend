import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../mongoose/schemas/user.js";

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
            console.log('find user', findUser, email);
            
            if (!findUser) {
                console.log('User not found');
                return done(null, false, {msg: 'Incorrect email'});
            }
            //const isMatch = await bcrypt.compare(passport, findUser.password);
            console.log('password', findUser.password, password);
            
            if (findUser.password !== password) {
                console.log('Incorrect password');
                return done(null, false, {msg: 'incorrect password'});;
            }
            done(null, findUser);
        } catch (error) {
            done(error, null);
        }
    })
)