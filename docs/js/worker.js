// Edge TTS Web Worker
// This worker handles API requests to bypass CORS limitations

// Import required modules (polyfill for fetch in workers)
try {
    importScripts('https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js');
} catch (e) {
    console.error('Failed to import scripts:', e);
}

// Base API URLs
const VOICES_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SYNTHESIS_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

// Helper function to create Edge TTS compatible headers
function getEdgeHeaders(isVoiceList = true) {
    const connectionId = `speech-connection-${Date.now()}`;
    
    return {
        'Accept': isVoiceList ? 'application/json' : 'audio/mp3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': isVoiceList ? 'application/json' : 'application/ssml+xml',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Sec-Fetch-Dest': isVoiceList ? 'empty' : 'audiopreload',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51',
        'X-Microsoft-OutputFormat': isVoiceList ? undefined : 'audio-16khz-128kbitrate-mono-mp3',
        'Referer': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold/reader.html',
        'Connection-Id': isVoiceList ? undefined : connectionId,
        'DNT': '1',
        'X-Search-ClientId': isVoiceList ? undefined : '7D8FA3AC47D6493D89F29B3FAE4A8ADE',
        'X-Search-AppId': isVoiceList ? undefined : '00000000480F91C1',
    };
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { type, data } = event.data;
    
    try {
        switch (type) {
            case 'fetch-voices':
                await fetchVoices();
                break;
            case 'generate-audio':
                await generateAudio(data);
                break;
            default:
                self.postMessage({ type: 'error', error: 'Unknown command' });
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
});

// Fetch available voices using XHR instead of fetch
async function fetchVoices() {
    try {
        // Use XMLHttpRequest instead of fetch to bypass CORS
        const xhr = new XMLHttpRequest();
        xhr.open('GET', VOICES_API_URL, true);
        
        // Set headers
        const headers = getEdgeHeaders(true);
        Object.keys(headers).forEach(key => {
            if (headers[key]) xhr.setRequestHeader(key, headers[key]);
        });
        
        // Create a promise to handle the async XHR request
        const voicesPromise = new Promise((resolve, reject) => {
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const voices = JSON.parse(xhr.responseText);
                        resolve(voices);
                    } catch (e) {
                        reject(new Error('Failed to parse response: ' + e.message));
                    }
                } else {
                    reject(new Error(`Error fetching voices: ${xhr.status} ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error while fetching voices'));
            };
        });
        
        // Send the request
        xhr.send();
        
        // Wait for the promise to resolve
        const voices = await voicesPromise;
        
        // Send the voices list back to the main thread
        self.postMessage({ type: 'voices-list', voices });
    } catch (error) {
        self.postMessage({ type: 'error', error: `Failed to fetch voices: ${error.message}` });
    }
}

// Generate audio from SSML using XHR
async function generateAudio(data) {
    try {
        const { ssml, voice } = data;
        
        // Send start message
        self.postMessage({ type: 'generation-start' });
        
        // Use XMLHttpRequest instead of fetch
        const xhr = new XMLHttpRequest();
        xhr.open('POST', SYNTHESIS_API_URL, true);
        xhr.responseType = 'arraybuffer';
        
        // Set headers
        const headers = getEdgeHeaders(false);
        Object.keys(headers).forEach(key => {
            if (headers[key]) xhr.setRequestHeader(key, headers[key]);
        });
        
        // Create a promise to handle the async XHR request
        const audioPromise = new Promise((resolve, reject) => {
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`Error generating audio: ${xhr.status} ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error while generating audio'));
            };
        });
        
        // Send the request
        xhr.send(ssml);
        
        // Wait for the promise to resolve
        const audioData = await audioPromise;
        
        // Send audio data back to main thread
        self.postMessage({
            type: 'audio-generated',
            audio: audioData,
            voiceInfo: voice
        }, [audioData]);
        
    } catch (error) {
        self.postMessage({ type: 'error', error: `Failed to generate audio: ${error.message}` });
    }
} 