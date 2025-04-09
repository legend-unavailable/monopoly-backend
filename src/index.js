import express from 'express';
import cors from 'cors';
import http from 'http'
import {Server} from 'socket.io'
//import socketSetup from './socket.js'
import mongoose from 'mongoose'
import router from './routes/index.js'
import session from 'express-session';
import passport from 'passport';
import gameSocket from './gameSocket.js';


const app = express();
const hServer = http.createServer(app);

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
}
const io = new Server(hServer, {cors: corsOptions});
app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
    secret: 'Baraggan Louisenbairn',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 60000 * 60 * 5,
        httpOnly: true,
        secure: false,
        rolling: true 
    }
}));
app.use((req, res, next) => {
    req.io = io;
    next();
})
app.use(passport.initialize());
app.use(passport.session());
app.use(router);

io.on('connection', (socket) => {
    console.log('new user connected', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);        
    });    
});

gameSocket(io);

mongoose.connect('mongodb://localhost/playerData')
.then(() => {
    console.log('Connected to DB')})
.catch(console.log((err) => {
        console.log(`Error: ${err}`)})
      )

const PORT = process.env.PORT || 3000;

hServer.listen(PORT, () => {console.log(`Running on port ${PORT}`);
})