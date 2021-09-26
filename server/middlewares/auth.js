const HttpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');

/** * Route authentication middleware to verify a token * * @param {object} req * @param {object} res * @param {function} next * */
const auth = (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    let token;
    if (authorizationHeader) {
        token = authorizationHeader.split(' ')[1];
    }
    if (token) {
        jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => { 
            if (err) { 
                res.status(HttpStatus.UNAUTHORIZED).json({ error: 'You are not authorized to perform this operation!' }); 
            } else {
                req.decodedToken = decoded
                next(); 
            } 
        });
    } else {
        res.status(HttpStatus.FORBIDDEN).json({ error: 'No token provided' });
    }
};

module.exports = auth