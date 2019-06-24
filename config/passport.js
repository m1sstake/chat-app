var LocalStrategy = require("passport-local").Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = function(passport, connection) {

    passport.serializeUser(function(user, done){
        done(null, user.username);
    });

    passport.deserializeUser(function(username, done){
        connection.query("SELECT * FROM users WHERE username = ? ", [username],
            function(err, rows){
                done(err, rows[0]);
            });
    });

    passport.use(
        'local-signup',
        new LocalStrategy({
                usernameField : 'username',
                passwordField: 'password',
                passReqToCallback: true
            },
            function(req, username, password, done){
                connection.query("SELECT * FROM users WHERE username = ? ",
                    [username], function(err, rows){
                        if(err)
                            return done(err);
                        if(rows.length){
                            return done(null, false, req.flash('signupMessage', 'Данный логин занят'));
                        }
                        if(password.length < 6){
                            return done(null, false, req.flash('signupMessage', 'Минимальная длина пароля 6 символов'));
                        }
                        if(username.length > 11){
                            return done(null, false, req.flash('signupMessage', 'Максимальная длина логина 11 символов'));
                        }
                        else{
                            var newUserMysql = {
                                username: username,
                                password: bcrypt.hashSync(password, null, null)
                            };

                            var insertQuery = "INSERT INTO users (username, password) values (?, ?)";

                            connection.query(insertQuery, [newUserMysql.username, newUserMysql.password],
                                function(err, rows){
                                    newUserMysql.id = rows.insertId;
                                    return done(null, newUserMysql);
                                });
                        }
                    });
            })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
                usernameField : 'username',
                passwordField: 'password',
                passReqToCallback: true
            },
            function(req, username, password, done){
                connection.query("SELECT * FROM users WHERE username = ? ", [username],
                    function(err, rows){
                        if(err)
                            return done(err);
                        if(!rows.length){
                            return done(null, false, req.flash('loginMessage', 'Пользователя с данным логином не существует'));
                        }
                        if(!bcrypt.compareSync(password, rows[0].password))
                            return done(null, false, req.flash('loginMessage', 'Неверный пароль'));
                        return done(null, rows[0]);

                    });
            })
    );
};