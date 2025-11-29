let display = document.getElementById('display');
let currentValue = '0';
let previousValue = '';
let operator = null;
let shouldResetDisplay = false;
let inputHistory = '';
let inputTokens = []; // tokenized inputs: numbers and operators

// Theme support: toggle light/dark and persist preference
function applyTheme(isDark) {
    if (isDark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    const cb = document.getElementById('themeToggle');
    if (cb) cb.checked = !!isDark;
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function toggleTheme() {
    const cb = document.getElementById('themeToggle');
    const isDark = cb ? cb.checked : document.body.classList.contains('dark');
    applyTheme(isDark);
}

(function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { stored = null; }
    let isDark = false;
    if (stored === 'dark') isDark = true;
    else if (stored === 'light') isDark = false;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDark = true;
    applyTheme(isDark);
    // Attach change handler
    const cb = document.getElementById('themeToggle');
    if (cb) cb.addEventListener('change', () => toggleTheme());
})();

function updateDisplay() {
    display.textContent = currentValue;
}

function appendNumber(num) {
    const isNewNumber = shouldResetDisplay;
    if (isNewNumber) {
        currentValue = num;
        shouldResetDisplay = false;
    } else {
        if (currentValue === '0' && num !== '.') {
            currentValue = num;
        } else if (num === '.' && currentValue.includes('.')) {
            return;
        } else {
            currentValue += num;
        }
    }
    // Update tokenized history: if starting a new number, treat this as a new token. Otherwise append digit.
    if (isNewNumber) {
        // we already started a new number token
        inputTokens.push(num);
    } else {
        // either append to last token if it's a number, or push new
        const last = inputTokens[inputTokens.length - 1];
        if (last !== undefined && /^[0-9.]+$/.test(last)) {
            inputTokens[inputTokens.length - 1] = String(last) + num;
        } else {
            inputTokens.push(num);
        }
    }

    // Debug log tokens
    const tokensStr = inputTokens.join('');
    console.log('tokens:', tokensStr, 'inputTokens array:', JSON.stringify(inputTokens));

    // Check token-sequence for 6+7
    if (inputTokens.slice(-3).join('') === '6+7') {
        console.log('>>> Detected 6+7 <<<');
        showVideoPopup('67kid');
    }

    // Check exact token sequence for 9+4+4+8+3
    console.log('Checking if', tokensStr, 'endsWith 9+4+4+8+3:', tokensStr.endsWith('9+4+4+8+3'));
    if (tokensStr.endsWith('9+4+4+8+3')) {
        console.log('>>> DETECTED 9+4+4+8+3 <<<');
        flashMessage('✓ SEQUENCE DETECTED: 9+4+4+8+3');
        showVideoPopup('baby');
    }
    
    // Check if result equals 67/41 and show videos every time
    if (operator !== null && !isNaN(parseFloat(previousValue)) && !isNaN(parseFloat(currentValue))) {
        let tempResult;
        const prev = parseFloat(previousValue);
        const curr = parseFloat(currentValue);
        
        switch (operator) {
            case '+':
                tempResult = prev + curr;
                break;
            case '-':
                tempResult = prev - curr;
                break;
            case '*':
                tempResult = prev * curr;
                break;
            case '/':
                tempResult = curr !== 0 ? prev / curr : null;
                break;
            default:
                tempResult = null;
        }
        
        if (tempResult === 67) {
            showVideoPopup('diddy');
        }
        
        if (tempResult === 41) {
            showVideoPopup('41');
        }
        
        if (tempResult === 28) {
            console.log('>>> DETECTED 9+4+4+8+3 via result = 28 <<<');
            showVideoPopup('baby');
        }
    }
    
    updateDisplay();
}

    // small temporary on-screen message for debugging/confirmation
    function flashMessage(text, ms = 1800) {
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            left: 50%;
            top: 12px;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 8px 14px;
            border-radius: 8px;
            z-index: 30000;
            font-family: sans-serif;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), ms);
    }

    // keyboard support: map digits/operators to calculator functions
    window.addEventListener('keydown', (e) => {
        // ignore if focus is in an input (none here) but be safe
        const key = e.key;
        if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            appendNumber(key);
            return;
        }
        if (key === '+' || key === '-' || key === '*' || key === '/') {
            e.preventDefault();
            appendOperator(key);
            return;
        }
        if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculate();
            return;
        }
        if (key === 'Backspace') {
            e.preventDefault();
            deleteLast();
            return;
        }
        if (key.toLowerCase() === 'c') {
            e.preventDefault();
            clearDisplay();
            return;
        }
    });

function appendOperator(op) {
    if (operator !== null && !shouldResetDisplay) {
        calculate();
    }
    previousValue = currentValue;
    operator = op;
    shouldResetDisplay = true;
    // record operator in token history
    inputTokens.push(op);
    console.log('>>> OPERATOR pressed:', op, '| tokens now:', JSON.stringify(inputTokens), '| joined:', inputTokens.join(''));
}

function calculate() {
    if (operator === null || shouldResetDisplay) {
        return;
    }

    let result;
    const prev = parseFloat(previousValue);
    const current = parseFloat(currentValue);

    // Special case: 6+7 = 67
    if (prev === 6 && operator === '+' && current === 7) {
        result = 67;
    } else {
        switch (operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                result = current !== 0 ? prev / current : 0;
                break;
            default:
                return;
        }
    }

    currentValue = result.toString();
    // reset history to the resulting value
    inputHistory = currentValue;
    inputTokens = [currentValue];
    operator = null;
    shouldResetDisplay = true;
    updateDisplay();
}

function clearDisplay() {
    currentValue = '0';
    previousValue = '';
    operator = null;
    shouldResetDisplay = false;
    inputHistory = '';
    inputTokens = [];
    updateDisplay();
}

function deleteLast() {
    if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);
    } else {
        currentValue = '0';
    }
    // also remove last char from history if present
    if (inputHistory.length > 0) inputHistory = inputHistory.slice(0, -1);
    // update token array: remove char from last number token if exists
    const last = inputTokens[inputTokens.length - 1];
    if (last !== undefined && /^[0-9.]+$/.test(last)) {
        if (last.length > 1) {
            inputTokens[inputTokens.length - 1] = last.slice(0, -1);
        } else {
            inputTokens.pop();
        }
    }
    updateDisplay();
}

function showVideoPopup(videoType) {
    const videoContainer = document.createElement('div');
    videoContainer.id = 'videoPopup';
    videoContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const video = document.createElement('video');
    video.style.cssText = `
        width: 90%;
        height: 90%;
        object-fit: contain;
    `;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    // If video file fails to load, alert so user can check filename
    video.addEventListener('error', () => {
        const src = video.src || '(unknown)';
        alert('Failed to load video: ' + src + '\nMake sure the file exists in the site folder and the filename matches exactly.');
    });

    // Set video source based on type
    if (videoType === '67kid') {
        video.src = '67 kid original video - Zach Productions (720p, h264).mp4';
    } else if (videoType === 'diddy') {
        video.src = 'What Is This Diddy Blud Doing On The Calculator Full Version Lyrics - Layzzz (720p, h264).mp4';
    } else if (videoType === '41') {
        video.src = '41 but I got 41 gold original video - Zach Productions (1080p, h264).mp4';
    } else if (videoType === 'baby') {
        video.src = "Here's the template of the baby reaction.mp4";
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: white;
        border: none;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        border-radius: 50%;
        z-index: 10001;
    `;
    closeBtn.onclick = () => videoContainer.remove();

    videoContainer.appendChild(video);
    videoContainer.appendChild(closeBtn);
    document.body.appendChild(videoContainer);

    // Request fullscreen
    if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(err => {
            console.warn('Fullscreen request failed:', err);
        });
    } else if (videoContainer.webkitRequestFullscreen) {
        // Safari/webkit
        videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.mozRequestFullScreen) {
        // Firefox
        videoContainer.mozRequestFullScreen();
    } else if (videoContainer.msRequestFullscreen) {
        // IE 11
        videoContainer.msRequestFullscreen();
    }

    // try to play (some browsers require a user gesture; typing should count)
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.warn('Video play was prevented:', err);
        });
    }
}

updateDisplay();
