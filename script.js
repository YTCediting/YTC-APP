// DOM Elements
const video = document.getElementById('video-preview');
const videoInput = document.getElementById('video-upload');
const framesContainer = document.getElementById('frames-container');
const timeline = document.getElementById('timeline');
const trimCursor = document.getElementById('trim-cursor');
const splitMarker = document.getElementById('split-marker');
const timeDisplay = document.getElementById('time-display');

// State Management
let videoClips = [];
let isTrimMode = false;
let isSplitMode = false;
let currentTime = 0;
let videoDuration = 0;
let undoStack = [];
let redoStack = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    videoInput.addEventListener('change', handleVideoUpload);
    video.addEventListener('timeupdate', updateVideoTime);
    video.addEventListener('loadedmetadata', initializeVideo);
    timeline.addEventListener('mousemove', handleTimelineHover);
    timeline.addEventListener('click', handleTimelineClick);
});

// Video Handlers
function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    video.style.display = 'block';
    document.getElementById('file-name').textContent = `Loaded: ${file.name}`;
    
    addToHistory(`Imported video: ${file.name}`);
}

function initializeVideo() {
    videoDuration = video.duration;
    createInitialClip();
    generateVideoFrames();
    updateTimeDisplay();
}

function createInitialClip() {
    videoClips = [{
        id: Date.now(),
        start: 0,
        end: videoDuration,
        element: createClipElement(0, videoDuration)
    }];
    renderClips();
}

// Timeline Functions
function handleTimelineHover(e) {
    const rect = timeline.getBoundingClientRect();
    const position = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (position / rect.width) * videoDuration;

    // Update trim cursor or split marker position
    if (isTrimMode) {
        trimCursor.style.left = `${position}px`;
    } else if (isSplitMode) {
        splitMarker.style.left = `${position}px`;
    }
}

function handleTimelineClick(e) {
    const rect = timeline.getBoundingClientRect();
    const position = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (position / rect.width) * videoDuration;

    if (isTrimMode) {
        applyTrim(time);
    } else if (isSplitMode) {
        splitClip(time);
    } else {
        video.currentTime = time;
    }
}

// Clip Management
function createClipElement(start, end) {
    const clip = document.createElement('div');
    clip.className = 'clip';
    clip.style.left = `${(start / videoDuration) * 100}%`;
    clip.style.width = `${((end - start) / videoDuration) * 100}%`;
    
    // Add thumbnail (simplified - would use canvas in real app)
    const hue = Math.floor((start / videoDuration) * 360);
    clip.style.background = `linear-gradient(45deg, hsl(${hue}, 80%, 50%), #333)`;
    
    return clip;
}

function renderClips() {
    // Clear existing clips
    document.querySelectorAll('.clip').forEach(el => el.remove());
    
    // Add all clips
    videoClips.forEach(clip => {
        document.getElementById('video-track').appendChild(clip.element);
    });
}

// Core Features
function activateTrimMode() {
    isTrimMode = !isTrimMode;
    isSplitMode = false;
    
    timeline.classList.toggle('trim-mode');
    timeline.classList.remove('split-mode');
    
    if (isTrimMode) {
        addToHistory("Entered trim mode");
    }
}

function applyTrim(time) {
    // For demo - would implement actual trim logic
    addToHistory(`Trimmed at ${time.toFixed(2)}s`);
    alert(`Video would be trimmed at ${time.toFixed(2)} seconds`);
}

function splitClip(time) {
    // Find clip to split
    const clipIndex = videoClips.findIndex(clip => 
        time >= clip.start && time <= clip.end
    );
    
    if (clipIndex >= 0) {
        const clip = videoClips[clipIndex];
        const newClip1 = {
            id: Date.now(),
            start: clip.start,
            end: time,
            element: createClipElement(clip.start, time)
        };
        
        const newClip2 = {
            id: Date.now() + 1,
            start: time,
            end: clip.end,
            element: createClipElement(time, clip.end)
        };
        
        // Replace original clip with two new clips
        videoClips.splice(clipIndex, 1, newClip1, newClip2);
        renderClips();
        
        addToHistory(`Split clip at ${time.toFixed(2)}s`);
    }
}

function showFrames() {
    document.querySelector('.frame-view').classList.toggle('frame-view-active');
}

// Frame Generation
function generateVideoFrames() {
    framesContainer.innerHTML = '';
    
    // Generate sample frames (would use canvas in real app)
    const frameCount = Math.min(30, Math.floor(videoDuration));
    
    for (let i = 0; i < frameCount; i++) {
        const time = (i / frameCount) * videoDuration;
        const frame = document.createElement('div');
        frame.className = 'frame-thumbnail';
        
        // Simulate frame thumbnail
        const hue = Math.floor((time / videoDuration) * 360);
        frame.style.background = `linear-gradient(45deg, hsl(${hue}, 80%, 50%), #333)`;
        frame.dataset.time = time;
        
        frame.addEventListener('click', () => {
            video.currentTime = time;
        });
        
        framesContainer.appendChild(frame);
    }
}

// Time Display
function updateVideoTime() {
    currentTime = video.currentTime;
    updateTimeDisplay();
    
    // Update playhead position
    const percent = (currentTime / videoDuration) * 100;
    document.getElementById('playhead').style.left = `${percent}%`;
}

function updateTimeDisplay() {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(videoDuration)}`;
}

// History Management
function addToHistory(action) {
    undoStack.push({
        action,
        clips: JSON.parse(JSON.stringify(videoClips)),
        time: currentTime
    });
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        const state = undoStack.pop();
        redoStack.push(state);
        
        videoClips = state.clips;
        currentTime = state.time;
        video.currentTime = currentTime;
        
        renderClips();
        console.log(`Undo: ${state.action}`);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        
        videoClips = state.clips;
        currentTime = state.time;
        video.currentTime = currentTime;
        
        renderClips();
        console.log(`Redo: ${state.action}`);
    }
}

// UI Controls
function zoomIn() {
    document.querySelector('.frames-container').style.height = '120px';
}

function zoomOut() {
    document.querySelector('.frames-container').style.height = '80px';
}

function exportVideo() {
    alert("Exporting video...");
    // Would implement actual export logic
}
