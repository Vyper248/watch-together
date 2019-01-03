const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
    // console.log('connected to socket.io!');
    
    //get id from url
    let idTest = client.request.headers.referer.match(/[a-zA-Z0-9]+$/);
    let id = idTest ? idTest[0] : getID();
    client.join(id);
    
    //when receives a message, send to everyone else
    client.on('video-message', data => {
        client.to(data.id).emit('video-message', data);
    });
    
    client.on('keypress', data => {
        // console.log('Passing keypress: ', data);
        client.to(data.id).emit('keypress', data);
    });
    
    //when a user disconnects
    // client.on('disconnect', () => {
    //     // console.log('disconnected');
    // });
});

function getID(){
    let id = '';
    const possibleValues = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let length = parseInt(Math.random()*10)+15;
    for (let i = 0; i < length; i++){
        const pos = parseInt(Math.random()*possibleValues.length);
        id += possibleValues[pos];
    }        
    return id;
}

app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/public/index.html');
});

app.get('/video', (req, res) => {
    let id = getID();
    res.redirect('/video/'+id);
});

app.get('/video/:id', (req, res) => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl
    res.render('player', {id: req.params.id, url});
});

app.get('*', function(req, res){
    // res.send('404 Page Not Found');
    res.redirect('/');
});

let port = process.env.PORT || 34862;
var ip = process.env.IP;
server.listen(port, ip, function(){
    console.log('Listening on port '+port);
});