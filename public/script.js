const video = document.querySelector('video');
const source = document.querySelector('source');
const videoContainer = document.querySelector('#videoContainer');
const fileInput = document.querySelector('#fileSelect');
const startBtn = document.querySelector('#startBtn');
const fileLabel = document.querySelector('#fileLabel');
const copiedLbl = document.querySelector('#copiedLbl');
const phase2 = document.querySelector('#phase2');
const fullscreenBtn = document.querySelector('#fullscreenBtn');
const videoText1 = document.querySelector('#videoText1');
const videoText2 = document.querySelector('#videoText2');

const socket = io();
let blocked = false;
let seekTimer = null;

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

document.querySelector('#sessionLink').addEventListener('click', function(){
    const range = document.createRange();
    const selection = window.getSelection();

    // Clear selection from any previous data.
    selection.removeAllRanges();

    // Make the range select the link.
    range.selectNodeContents(this);

    // Add that range to the selection.
    selection.addRange(range);

    // Copy the selection to clipboard.
    document.execCommand('copy');

    // Clear selection.
    selection.removeAllRanges();
    
    copiedLbl.innerText = 'Copied to clipboard!';
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