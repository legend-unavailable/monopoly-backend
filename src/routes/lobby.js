import express from 'express';
import '../strats/local-strats.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
   if (req.session.visited && (req.session.user !== undefined)) {
      return next();
   }
   else res.status(401).json({authenticated: false});
}



 router.get('/lobby', isAuthenticated, (req, res) => {
    res.status(200).json({authenticated: true});
 })

 export default router;