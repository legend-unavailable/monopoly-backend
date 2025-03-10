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
            if (!findUser) {
                throw new Error("User not found");
            }
            if (findUser.password !== password) {
                throw new Error("Incorrect password");
            }
            done(null, findUser);
        } catch (error) {
            done(error, null);
        }
    })
)