module.exports = function(app, passport, connection) {


    app.get('/', function (req, res, next) {
        if (req.isAuthenticated()){
            res.redirect('/chat')
        }
        else{
            res.redirect('/login');
        }
    });
    app.get('/login', function(req, res){
        res.render('login.ejs', {message:req.flash('loginMessage')});
    });

    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/chat',
            failureRedirect: '/login',
            failureFlash: true
        }),
        function(req, res){
            if(req.body.remember){
                req.session.cookie.maxAge = 1000 * 60 * 3;
            }else{
                req.session.cookie.expires = false;
            }
            res.redirect('/');
        });

    app.get('/signup', function(req, res){
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/chat',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/chat', isLoggedIn, function(req, res){
        res.render('profile.ejs', {
            user:req.user
        });
    });

    app.get('/logout', function(req,res){
        req.logout();
        res.redirect('/');
    });
    app.post('/addroom', function (req,res) {
        if(!req.body.roomname) return res.redirect('/chat')
        connection.query('INSERT INTO conversation VALUES (?,?)',[null, req.body.roomname], function (err) {
            if(err) throw err;
        });
        res.redirect('/chat');
    });
};

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();

    res.redirect('/');
}