const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
    console.log('connected to socket.io!');

    //joining room example
    // client.join('1', () => {
    //     io.to('1').emit('receive', 'hello2');
    // });
    
    //when receives a message, send to everyone else
    client.on('video-message', data => {
        io.to(data.id).emit('video-message', data);
    });
    
    //when receive request to join a room
    client.on('join', data => {
        if (io.sockets.adapter.rooms[data]){
            const length = io.sockets.adapter.rooms[data].length;
            if (length >= 2){
                console.log('Room Full');
                client.emit('error-message', {type: 0, message: 'Room Full'});
                return;
            } else {
                console.log('Joining Room: ', data);
                client.join(data);
                return;
            }
        } else {
            console.log('Joining Room: ', data);
            client.join(data);
        }
    });
    
    //when a user disconnects
    client.on('disconnect', () => {
        console.log('disconnected');
    });
});

app.use(express.static(__dirname+'/public'));

app.get('*', function(req, res){
    res.send('404 Page Not Found');
});

// let port = process.env.PORT || 34862;
// var ip = process.env.IP;
// server.listen(port, ip, function(){
//     console.log('Listening on port '+port);
// });

server.listen(34862);