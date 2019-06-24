module.exports = function(io, connection, find) {
    var users = [];
    var roomId = 1;
    var url = "/";
// connect
    io.on('connection', function (socket) {
        if (socket.handshake.session.passport == undefined){
            socket.emit('redirect', url);
        } else {
            if (users.length == 0) {
                users.push(socket.handshake.session.passport.user);
            } else {
                if (find(users, socket.handshake.session.passport.user) == -1)
                    users.push(socket.handshake.session.passport.user);
            }
            socket.join(roomId);
            socket.emit('rooms', roomId);
            io.sockets.emit('get users', users);
            var getLastComments = function (roomId) {
                connection.query('SELECT * FROM `messages` WHERE `conversationid`= ?', roomId, function (err, rows) {
                    if (err) {
                        socket.emit('error', err.code);
                    } else {
                        for (k in rows) {
                            var row = rows[k];
                            var username = row.username;
                            var message = row.message;
                            var date_msg = row.created_at.toLocaleString();
                            socket.emit('old message', username, message, date_msg);
                        }
                    }
                })
            };
            var getRooms = function () {
                connection.query('SELECT * FROM conversation', function (err, rows) {
                    if (err) {
                        socket.emit('error', err.code);
                    } else {
                        var rooms = [];
                        for (k in rows) {
                            var row = rows[k];
                            var room =
                                {
                                    roomId: row.id,
                                    roomName: row.name
                                }
                            rooms.push(room);
                        }
                        socket.emit('get rooms', rooms);

                    }
                })
            };
            getRooms();
            getLastComments(roomId);
            socket.on('disconnect', function () {
                console.log(socket.handshake.session.passport.user);
                var index = users.indexOf(socket.handshake.session.passport.user);
                if (index > -1) {
                    users.splice(index, 1);
                }
                io.sockets.emit('get users', users);
            });
            socket.on('room change', function (roomId) {
                socket.leaveAll();
                socket.join(roomId);
                socket.emit('rooms', roomId);
                getLastComments(roomId);
            });
            socket.on('send message', function (message, roomId) {
                var date_msg = new Date().toLocaleString();
                var username = socket.handshake.session.passport.user;
                console.log(date_msg);
                connection.query('INSERT INTO messages(username,message,created_at,conversationid) values (?,?,?,?)', [username, message, date_msg, roomId]
                ,   function (error) {
                    if (error) throw error;
                });
                io.to(roomId).emit('new message', username, message, date_msg);

            });
        }
    });
}