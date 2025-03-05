import express from 'express';
import cors from 'cors';
import http from 'http'
import {Server} from 'socket.io'
//import socketSetup from './socket.js'
import mongoose from 'mongoose'
import router from './routes/index.js'
import session from 'express-session';
import passport from 'passport';


const app = express();
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
}
app.use(cors(corsOptions));
app.use(session({
    secret: 'Baraggan Louisenbairn',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 60000 * 60 * 5,
        httpOnly: true,
        secure: true,
        rolling: true 
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(router);

//const server = http.createServer(app);
//const io = new Server(server);

mongoose.connect('mongodb://localhost/playerData')
.then(() => {
    console.log('Connected to DB')})
.catch(console.log((err) => {
        console.log(`Error: ${err}`)}))


//socketSetup(io);

// app.get(('/'), (req, res) => {
//     console.log('active');
//     res.sendStatus(200)
    
// })

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {console.log(`Running on port ${PORT}`);
})