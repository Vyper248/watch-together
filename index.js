const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
    console.log('connected to socket.io!');

    //joining room example
    client.join('1', () => {
        io.to('1').emit('receive', 'hello2');
    });
    
    //event example - if client emits to 'event', this will receive it
    client.on('event', data => {
        console.log(data);
    });
    
    //when a user disconnects
    client.on('disconnect', () => {
        console.log('disconnected');
    });
    
    
    client.emit('video-message', {data: 'hello'});
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

server.listen(3000);