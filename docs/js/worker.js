// Edge TTS Web Worker
// This worker handles API requests to bypass CORS limitations using WebSockets

// Import required modules (polyfill for fetch in workers)
try {
    importScripts('https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js');
} catch (e) {
    console.error('Failed to import scripts:', e);
}

// Base API URLs
const VOICES_API_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SYNTHESIS_API_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

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

// Generate a unique connection ID
function generateConnectionId() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
    return uuid.replace(/-/g, '');
}

// Get current timestamp in Edge TTS format
function getTimestamp() {
    const date = new Date();
    const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
    };
    const dateString = date.toLocaleString('en-US', options);
    return dateString.replace(/\u200E/g, '') + ' GMT+0000 (Coordinated Universal Time)';
}

// Fetch available voices using WebSocket
async function fetchVoices() {
    try {
        self.postMessage({ type: 'info', message: 'Fetching voices...' });
        
        // Use HTTP XMLHttpRequest for the voices list since WebSocket doesn't work for this endpoint
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4', true);
        
        // Set headers
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Origin', 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold');
        xhr.setRequestHeader('Referer', 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold/reader.html');
        xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51');
        xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
        xhr.setRequestHeader('Sec-Fetch-Dest', 'empty');
        xhr.setRequestHeader('Sec-Fetch-Mode', 'cors');
        xhr.setRequestHeader('Sec-Fetch-Site', 'cross-site');
        xhr.setRequestHeader('DNT', '1');
        
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

// Generate audio from SSML using WebSocket
async function generateAudio(data) {
    try {
        const { ssml, voice } = data;
        
        // Send start message
        self.postMessage({ type: 'generation-start' });
        
        // Generate a connection ID
        const connectionId = generateConnectionId();
        
        // Create WebSocket connection
        const socketUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;
        const socket = new WebSocket(socketUrl);
        
        // Audio data chunks
        const audioChunks = [];
        const dataHeaderSeparator = new TextEncoder().encode("Path:audio\r\n");
        
        // Create a promise for the WebSocket operation
        const audioPromise = new Promise((resolve, reject) => {
            let isAudioReceived = false;
            
            socket.onopen = function() {
                // Send speech config
                const timestamp = getTimestamp();
                socket.send(
                    "X-Timestamp:" + timestamp + "\r\n" +
                    "Content-Type:application/json; charset=utf-8\r\n" +
                    "Path:speech.config\r\n\r\n" +
                    '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
                    '"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},' +
                    '"outputFormat":"audio-16khz-128kbitrate-mono-mp3"' +
                    "}}}}\r\n"
                );
                
                // Send SSML
                socket.send(
                    "X-RequestId:" + connectionId + "\r\n" +
                    "Content-Type:application/ssml+xml\r\n" +
                    "X-Timestamp:" + timestamp + "Z\r\n" +
                    "Path:ssml\r\n\r\n" +
                    ssml
                );
            };
            
            socket.onmessage = async function(event) {
                const data = event.data;
                
                if (typeof data === 'string') {
                    if (data.includes("Path:turn.end")) {
                        // End of audio message received
                        socket.close();
                        
                        if (audioChunks.length > 0) {
                            // Combine all audio chunks
                            processAudioChunks();
                        } else if (!isAudioReceived) {
                            reject(new Error("No audio data received"));
                        }
                    }
                } else if (data instanceof Blob) {
                    // Binary data - audio chunk
                    audioChunks.push(data);
                    isAudioReceived = true;
                }
            };
            
            socket.onerror = function(error) {
                reject(new Error(`WebSocket error: ${error.message || 'Unknown error'}`));
            };
            
            socket.onclose = function() {
                if (!isAudioReceived) {
                    reject(new Error("Connection closed without receiving audio data"));
                }
            };
            
            // Function to process audio chunks when complete
            async function processAudioChunks() {
                try {
                    // Process all audio blobs
                    let combinedAudioData = new Uint8Array(0);
                    
                    for (const blob of audioChunks) {
                        // Convert blob to arraybuffer
                        const arrayBuffer = await blob.arrayBuffer();
                        const chunk = new Uint8Array(arrayBuffer);
                        
                        // Find the audio data by searching for the separator
                        const separatorIndex = findSeparatorIndex(chunk, dataHeaderSeparator);
                        
                        if (separatorIndex !== -1) {
                            // Get only the audio part after the separator
                            const audioData = chunk.slice(separatorIndex + dataHeaderSeparator.length);
                            
                            // Combine with previous chunks
                            const newCombined = new Uint8Array(combinedAudioData.length + audioData.length);
                            newCombined.set(combinedAudioData, 0);
                            newCombined.set(audioData, combinedAudioData.length);
                            combinedAudioData = newCombined;
                        }
                    }
                    
                    if (combinedAudioData.length > 0) {
                        // Resolve with the combined audio data
                        resolve(combinedAudioData.buffer);
                    } else {
                        reject(new Error("No valid audio data found in the response"));
                    }
                } catch (error) {
                    reject(new Error(`Error processing audio chunks: ${error.message}`));
                }
            }
        });
        
        // Wait for the promise to resolve with the audio data
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

// Helper function to find the index of a separator in a Uint8Array
function findSeparatorIndex(array, separator) {
    for (let i = 0; i < array.length - separator.length + 1; i++) {
        let found = true;
        for (let j = 0; j < separator.length; j++) {
            if (array[i + j] !== separator[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i;
        }
    }
    return -1;
} 