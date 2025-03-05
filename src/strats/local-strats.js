import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../mongoose/schemas/user.js";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const result = await User.findOne({id});
        if (!result) {
            throw new Error("User not found");
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