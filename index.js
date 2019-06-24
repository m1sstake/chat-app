var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var server = require('http').createServer(app);
var io = require ('socket.io').listen(server);
var port = process.env.PORT || 3000;
var mysql = require('mysql');
var passport = require('passport');
var flash = require('connect-flash');
var dbconfig = require('./config/database');
var session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
var connection = mysql.createConnection(dbconfig.connection);
connection.query("SET SESSION wait_timeout = 604800"); // 7 days timeout
connection.query('USE ' + dbconfig.database);
connection.query('SET NAMES utf8mb4');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.set('view engine', 'ejs');
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static('public'));

require('./config/passport')(passport, connection);


function handleDisconnect(connection) {
    connection.on('error', function(err) {
        if (!err.fatal) {
            return;
        }

        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            throw err;
        }

        console.log('Re-connecting lost connection: ' + err.stack);

        connection = mysql.createConnection(dbconfig.connection);
        handleDisconnect(connection);
        connection.connect();
    });
}

function find(array, value) {
    if (array.indexOf) { // если метод существует
        return array.indexOf(value);
    }

    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) return i;
    }

    return -1;
}
handleDisconnect(connection);

io.use(sharedsession(session, {
    autoSave: true
}));

require('./app/routes.js')(app, passport, connection);
require('./config/socket.js')(io, connection, find);


server.timeout = 0;

server.listen(port);
console.log("Port: " + port);