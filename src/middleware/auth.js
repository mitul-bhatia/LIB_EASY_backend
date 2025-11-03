const jwt = require('jsonwebtoken');

require('dotenv').config();

// signin token 

const JWT_SECRET = process.env.JWT_SECRET

function signToken(payload){

    return jwt.sign(payload,JWT_SECRET,{expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
    )
}

function verifyToken(req,res,next){
    try{
        let token = req.cookies?.token;

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];}
        if (!token){ 
            return res.status(401).json({message: 'Authentication required'})
        }
        const decoded = jwt.verify(token,JWT_SECRET)
        req.user = decoded; // { id ,role,iat,exp }

        next()
    
    }
    catch(err){
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}


function requireAdmin(req, res, next) {

    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    next();
  }



module.exports = { signToken , verifyToken , requireAdmin }
/// verify token