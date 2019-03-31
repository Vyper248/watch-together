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
let spacePressedWhilePlaying = false;
let spacePressedWhilePaused = false;
let seekTimer = null;
let spaceTimer = null;

let timers = {
    keyTimer1: null,
    keyTimer2: null,
}

/*=====================================FILE INPUT=====================================*/
fileInput.addEventListener('change', () => {
    let file = fileInput.files[0];
    useFile(file);
});

function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        let file = ev.dataTransfer.items[i].getAsFile();
        useFile(file);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        let file = ev.dataTransfer.files[i];
        useFile(file);
    }
  } 
  
  // Pass event to removeDragData for cleanup
  removeDragData(ev);
}

function dragOverHandler(ev) {
  ev.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function removeDragData(ev) {
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to remove the drag data
    ev.dataTransfer.items.clear();
  } else {
    // Use DataTransfer interface to remove the drag data
    ev.dataTransfer.clearData();
  }
}

function useFile(file){
    fileLabel.innerText = file.name;
    let objectURL = window.URL.createObjectURL(file);
    video.src = objectURL;
    video.pause();
}

startBtn.addEventListener('click', () => {
    videoContainer.style.display = 'flex';
    phase2.style.display = 'none';
});

/*===================================COPY LINK=======================================*/
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

/*======================================VIDEO CONTROLS======================================*/
fullscreenBtn.addEventListener('click', () => {
    openFullscreen(videoContainer);
    fullscreenBtn.style.display = 'none';
});

video.addEventListener('pause', (e)=>{
    if (spacePressedWhilePlaying) {
        video.play();
        video.removeAttribute("controls")   
        return;
    }
    if (blocked) return;
    socket.emit('video-message', {type: 'pause', id: clientID});
});

video.addEventListener('play', (e)=>{
    if (spacePressedWhilePaused) {
        video.pause();
        return;
    }
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

document.addEventListener('fullscreenchange', closeFullscreen);
document.addEventListener('webkitfullscreenchange', closeFullscreen);
document.addEventListener('mozfullscreenchange', closeFullscreen);
document.addEventListener('msfullscreenchange', closeFullscreen);

function closeFullscreen(){
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        fullscreenBtn.style.display = 'block';
    }
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

/*==========================================CHAT==========================================*/
document.querySelector('body').addEventListener('keydown', (e) => {
    if (e.which === 32) {
        if (video.paused) spacePressedWhilePaused = true;
        else spacePressedWhilePlaying = true;
        if (spaceTimer) clearTimeout(spaceTimer);
        spaceTimer = setTimeout(() => {
            spacePressedWhilePaused = false; 
            spacePressedWhilePlaying = false; 
            spaceTimer = null; 
            video.setAttribute("controls","controls")   
        }, 500);
    }
    receiveKey(videoText2, e, 'keyTimer1');
    socket.emit('keypress', {code: e.code, key: e.key, id: clientID});
});

/*====================================SOCKET MESSAGES====================================*/
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

