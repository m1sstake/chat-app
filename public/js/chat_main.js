$(function(){
    $('#chatMessage').emojiInit({
        fontSize:20,
        success : function(data){

        },
        error : function(data,msg){
        }
    });
});

var socket = io();
$(document).ready(function () {

    $('.popup .close_window, .overlay').click(function (){
        $('.popup, .overlay').css({'opacity': 0, 'visibility': 'hidden'});
    });
    $('a.open_window').click(function (e){
        $('.popup, .overlay').css({'opacity': 1, 'visibility': 'visible'});
        e.preventDefault();
    });
    $('#roomtitle').append('<b class = "roomtitle">general</b>');
    socket.on('rooms', function (RoomId) {
        roomId = RoomId;
    });
    $('#chat-form').keyup(function (event) {
        if(event.which == 13) {
            if(!$.trim($("#chatMessage").val())) {
                event.preventDefault();
            }
            else{
                var chatMessage = $('#chatMessage');
                var message = chatMessage.val();
                chatMessage.val('');
                socket.emit('send message', message, roomId);
                event.preventDefault();

            }
        }});
    function userConnected(username) {
        $('.member-list').append('<li class ="online-user"><span class="status online">' +
            '<i class="fa fa-circle-o"></i></span><span>' + username + '</span></li>');
    }

    function addRoom(roomId, roomName) {
        if (roomId == 1){
            $('#conversation-list1').append($('<li class ="item active" id ="' + roomId + '"><a><i class="fa fa-user"></i><span>'
                + roomName + '</span></a></li>').click(function (event) {
                RoomClick(roomId, roomName);
            }))}
        else{
            $('#conversation-list1').append($('<li class ="item" id ="' + roomId + '"><a><i class="fa fa-user"></i><span>'
                + roomName + '</span></a></li>').click(function (event) {
                RoomClick(roomId, roomName);
            }));
        }
    }

    socket.on('new message', function (username, message, date_msg) {
        addMessage(username, message, date_msg);
        $(".chat-list").animate({ scrollTop: $('.chat-list')[0].scrollHeight}, 0);

    });
    socket.on('old message', function (username, message, date_msg) {
        addMessage(username, message, date_msg);
        $(".chat-list").animate({ scrollTop: $('.chat-list')[0].scrollHeight}, 0);

    });
    socket.on('get users', function (users) {
        $('.online-user').remove();
        for (var i = 0; i < users.length; i++) {
            userConnected(users[i])
        }
    });
    socket.on('get rooms', function (rooms) {
        for (var i = 0; i < rooms.length; i++) {
            addRoom(rooms[i].roomId, rooms[i].roomName);
        }
    });
    socket.on('redirect',function (url) {
        window.location.href = url;
    });
    function RoomClick(roomId, roomName){
        socket.emit('room change', roomId);
        $('.roomtitle').remove();
        $('#roomtitle').append('<b class = "roomtitle">' + roomName + '</b>');
        $("li").removeClass("active");
        var activeroom = $('#conversation-list1').find("#" + roomId);
        activeroom.addClass("active");
        var oldmessages = document.querySelectorAll("#message");
        $(oldmessages).remove();
        document.title = roomName +" | Chat";
    }
});