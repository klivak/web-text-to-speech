// Edge TTS Web Worker
// This worker handles API requests to bypass CORS limitations using WebSockets

// Import required modules (polyfill for fetch in workers)
try {
    importScripts('https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js');
} catch (e) {
    console.error('Failed to import scripts:', e);
}

// URL для голосів виконується через звичайний HTTP запит (для списку)
const VOICES_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

// Глобальні змінні для обробки аудіо
let audioChunks = [];
let combinedAudioData = new Uint8Array(0);
let webSocket = null;
let voiceInfo = null;
let endMessageReceived = false;

// Слухаємо повідомлення з головного потоку
self.addEventListener('message', async (event) => {
    const { type, data } = event.data;
    
    try {
        switch (type) {
            case 'fetch-voices':
                await fetchVoices();
                break;
            case 'generate-audio':
                voiceInfo = data.voice;
                await generateAudio(data.ssml);
                break;
            default:
                self.postMessage({ type: 'error', error: 'Unknown command' });
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
});

// Отримати унікальний ID з'єднання
function generateConnectionId() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
    return uuid.replace(/-/g, '');
}

// Отримати поточну дату у форматі веб-сокету Edge TTS
function getFormattedDate() {
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

// Створити заголовки та SSML для запиту
function createSsmlHeaders(requestId, timestamp, ssml) {
    return "X-RequestId:" + requestId + "\r\n" +
        "Content-Type:application/ssml+xml\r\n" +
        "X-Timestamp:" + timestamp + "Z\r\n" +
        "Path:ssml\r\n\r\n" +
        ssml;
}

// Знайти індекс роздільника в масиві байтів
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

// Отримати список голосів
async function fetchVoices() {
    try {
        self.postMessage({ type: 'info', message: 'Fetching voices...' });
        
        const response = await fetch(VOICES_API_URL);
        
        if (!response.ok) {
            throw new Error(`Error fetching voices: ${response.status} ${response.statusText}`);
        }
        
        const voices = await response.json();
        
        self.postMessage({ type: 'voices-list', voices });
    } catch (error) {
        self.postMessage({ type: 'error', error: `Failed to fetch voices: ${error.message}` });
    }
}

// Створити аудіо з SSML через WebSocket
async function generateAudio(ssml) {
    // Очистити попередні дані
    audioChunks = [];
    combinedAudioData = new Uint8Array(0);
    endMessageReceived = false;
    
    try {
        // Надіслати повідомлення про початок генерації
        self.postMessage({ type: 'generation-start' });
        
        // Створити WebSocket з'єднання
        const connectionId = generateConnectionId();
        const socketUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;
        
        webSocket = new WebSocket(socketUrl);

        // Налаштувати обробники подій
        webSocket.addEventListener('open', onSocketOpen.bind(null, ssml));
        webSocket.addEventListener('message', onSocketMessage);
        webSocket.addEventListener('error', onSocketError);
        webSocket.addEventListener('close', onSocketClose);
    } catch (error) {
        self.postMessage({ type: 'error', error: `Failed to initialize WebSocket: ${error.message}` });
    }
}

// Обробка відкриття WebSocket з'єднання
function onSocketOpen(ssml, event) {
    try {
        // Отримати поточну дату
        const timestamp = getFormattedDate();
        
        // Надіслати конфігурацію
        webSocket.send(
            "X-Timestamp:" + timestamp + "\r\n" +
            "Content-Type:application/json; charset=utf-8\r\n" +
            "Path:speech.config\r\n\r\n" +
            '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
            '"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},' +
            '"outputFormat":"audio-24khz-96kbitrate-mono-mp3"' +
            "}}}}\r\n"
        );
        
        // Надіслати SSML з заголовками
        webSocket.send(
            createSsmlHeaders(
                generateConnectionId(),
                timestamp,
                ssml
            )
        );
    } catch (error) {
        self.postMessage({ type: 'error', error: `Error in onSocketOpen: ${error.message}` });
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.close();
        }
    }
}

// Обробка повідомлень WebSocket
async function onSocketMessage(event) {
    try {
        const data = event.data;
        
        if (typeof data === 'string') {
            if (data.includes("Path:turn.end")) {
                endMessageReceived = true;
                
                // Обробити накопичені аудіо-чанки
                await processAudioChunks();
            }
        } else if (data instanceof Blob) {
            // Додати бінарні дані до списку чанків
            audioChunks.push(data);
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: `Error in onSocketMessage: ${error.message}` });
    }
}

// Обробка помилок WebSocket
function onSocketError(error) {
    self.postMessage({ type: 'error', error: `WebSocket error: ${error.message || 'Unknown error'}` });
}

// Обробка закриття WebSocket
function onSocketClose(event) {
    // Якщо отримали повідомлення про завершення, але ще не зберегли аудіо
    if (endMessageReceived && audioChunks.length > 0) {
        processAudioChunks().catch(error => {
            self.postMessage({ type: 'error', error: `Error processing audio after close: ${error.message}` });
        });
    } else if (!endMessageReceived && audioChunks.length === 0) {
        // Нічого не отримали - повторити спробу через 2 секунди
        setTimeout(() => {
            self.postMessage({ type: 'error', error: `Connection closed without receiving audio data` });
        }, 500);
    }
}

// Обробка аудіо-чанків та створення MP3
async function processAudioChunks() {
    if (audioChunks.length === 0) return;
    
    try {
        const dataSeparator = new TextEncoder().encode("Path:audio\r\n");
        
        // Обробка всіх блобів
        for (let i = 0; i < audioChunks.length; i++) {
            const blob = audioChunks[i];
            const arrayBuffer = await blob.arrayBuffer();
            const chunk = new Uint8Array(arrayBuffer);
            
            // Знайти роздільник аудіо-даних
            const separatorIndex = findSeparatorIndex(chunk, dataSeparator);
            
            if (separatorIndex !== -1) {
                // Отримати тільки частину після роздільника
                const audioData = chunk.slice(separatorIndex + dataSeparator.length);
                
                // Об'єднати з попередніми даними
                const newCombined = new Uint8Array(combinedAudioData.length + audioData.length);
                newCombined.set(combinedAudioData, 0);
                newCombined.set(audioData, combinedAudioData.length);
                combinedAudioData = newCombined;
            }
        }
        
        // Перевірити, чи маємо дані для збереження
        if (combinedAudioData.length > 0) {
            // Закрити з'єднання, якщо воно ще відкрите
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.close();
            }
            
            // Надіслати аудіо до головного потоку
            self.postMessage({
                type: 'audio-generated',
                audio: combinedAudioData.buffer,
                voiceInfo: voiceInfo
            }, [combinedAudioData.buffer]);
            
            // Очистити для наступного використання
            audioChunks = [];
            combinedAudioData = new Uint8Array(0);
            endMessageReceived = false;
        } else {
            throw new Error("No valid audio data found after processing chunks");
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: `Error processing audio chunks: ${error.message}` });
    }
} 