const routes = require('./server/routes/index.route');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
var cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config();

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'localhost:8080');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

// View Engine Setup 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.get('/public', (req, res) => {
    res.sendFile(req.query.path);
});

//Router
app.use('/api', routes);

const port = process.env.PORT || 3000;
// const port = 8080;
app.listen(port, () => {
    console.log('Example app listening on port ' + port);
});

if (process.env.ENV === 'local') {
    mongoose.connect('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
        .then(() => console.log('Connected to MongoDB...'))
        .catch((err) => console.log('Could not connected to MongoDB...', err));
} else {
    const DBURI = 'mongodb://' + process.env.DB_UNAME + ':' + process.env.DB_PASSWORD + '@' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME + '?authSource=' + process.env.AUTH_SOURCE;
    mongoose.connect(DBURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB...'))
        .catch((err) => console.log('Could not connected to MongoDB...', err));
}