const video = document.querySelector('video');
const source = document.querySelector('source');
const videoContainer = document.querySelector('#videoContainer');
const fileInput = document.querySelector('#fileSelect');
const idInput = document.querySelector('#id');
const startNewBtn = document.querySelector('#startNewBtn');
const joinExistingBtn = document.querySelector('#joinExistingBtn');
const startBtn = document.querySelector('#startBtn');
const fileLabel = document.querySelector('#fileLabel');
const sessionID = document.querySelector('#sessionID');
const phase1 = document.querySelector('#phase1');
const phase2 = document.querySelector('#phase2');
const error = document.querySelector('#error');
const fullscreenBtn = document.querySelector('#fullscreenBtn');
const videoText1 = document.querySelector('#videoText1');
const videoText2 = document.querySelector('#videoText2');

const socket = io();
let blocked = false;
let seekTimer = null;
let clientID;

let timers = {
    keyTimer1: null,
    keyTimer2: null,
}

fileInput.addEventListener('change', () => {
    let file = fileInput.files[0];
    fileLabel.innerText = file.name;
    let objectURL = window.URL.createObjectURL(file);
    video.src = objectURL;
    video.pause();
});

startBtn.addEventListener('click', () => {
    videoContainer.style.display = 'flex';
    phase2.style.display = 'none';
});

startNewBtn.addEventListener('click', () => {
    socket.emit('newRoom');
    phase1.style.display = 'none';
    phase2.style.display = 'flex';
});

joinExistingBtn.addEventListener('click', () => {
    let id = idInput.value;
    socket.emit('join', id);
});

fullscreenBtn.addEventListener('click', () => {
    openFullscreen(videoContainer);
    fullscreenBtn.style.display = 'none';
});

video.addEventListener('pause', ()=>{
    if (blocked) return;
    socket.emit('video-message', {type: 'pause', id: clientID});
});

video.addEventListener('play', ()=>{
    if (blocked) return;
    socket.emit('video-message', {type: 'play', id: clientID});
});

video.addEventListener('seeking', () => {
    if (blocked) return;
    if (seekTimer) {
        clearTimeout(seekTimer)
        seekTimer = null;
    }
    seekTimer = setTimeout(()=>{
        socket.emit('video-message', {type: 'seek', time: video.currentTime, id: clientID});
    }, 100);
    
});

document.querySelector('body').addEventListener('keydown', (e) => {
    receiveKey(videoText2, e, 'keyTimer1');
    socket.emit('keypress', {code: e.code, key: e.key, id: clientID});
});

socket.on('connect', function(){
    console.log('connected');
});

socket.on('newRoom', data => {
    clientID = data;
    sessionID.innerText = 'Your ID is: '+data;
});

socket.on('joined', data => {
    sessionID.innerText = 'Your ID is: '+data;
    clientID = data;
    phase1.style.display = 'none';
    phase2.style.display = 'flex';
});

socket.on('keypress', data => {
    receiveKey(videoText1, data, 'keyTimer2');
});

socket.on('video-message', data => {
    if (data.type === 'pause'){
        blocked = true;
        video.pause();
        setTimeout(()=>{blocked = false}, 100);
    } else if (data.type === 'play'){
        blocked = true;
        video.play();
        setTimeout(()=>{blocked = false}, 100);
    } else if (data.type === 'seek'){
        blocked = true;
        video.currentTime = data.time;
        setTimeout(()=>{blocked = false}, 100);
    }
});

socket.on('error-message', data => {
    error.innerText = data.message;
});

socket.on('disconnect', function(){
    console.log('disconnected');
});

document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitIsFullScreen) {
        fullscreenBtn.style.display = 'block';
    }
});

function receiveKey(element, data, timer){
    element.style.opacity = 1;
    
    if (timers[timer]) {
        clearTimeout(timers[timer]);
        timers[timer] = null;
    } else {
        element.innerHTML = '';
    }
    
    if (data.code === 'Space') element.innerHTML += ' ';
    else if (data.code === 'Backspace') element.innerHTML = element.innerHTML.slice(0,-1);
    else if (data.key.length === 1) element.innerHTML += data.key;
    
    if (video.paused) element.style.bottom = '100px';
    else element.style.bottom = '50px';
    
    timers[timer] = setTimeout(()=>{
        element.style.opacity = 0;
        timers[timer] = null;
    }, 2000);
}

function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}