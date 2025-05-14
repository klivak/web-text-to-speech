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
let isDataProcessed = false;
let isProcessing = false;
let dataSeparator = new TextEncoder().encode("Path:audio\r\n");

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
    isDataProcessed = false;
    isProcessing = false;
    
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
        
        // Встановлюємо таймаут на з'єднання (зменшуємо з 30 до 15 секунд)
        setTimeout(() => {
            if (webSocket && webSocket.readyState === WebSocket.OPEN && !endMessageReceived) {
                webSocket.close();
            }
        }, 15000); // 15 секунд часу очікування
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
                
                // Обробляємо дані відразу після отримання Path:turn.end
                // як це робиться в test-example
                await processAudioChunks();
                
                // Закриваємо з'єднання після обробки даних
                if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                    webSocket.close();
                }
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
    if (isDataProcessed) {
        return; // Якщо дані вже були оброблені, не робимо це ще раз
    }
    
    // Обробляємо будь-які доступні дані, навіть якщо не отримали повідомлення про закінчення
    if (audioChunks.length > 0) {
        processAudioChunks().catch(error => {
            self.postMessage({ type: 'error', error: `Error processing audio after close: ${error.message}` });
        });
    } else {
        self.postMessage({ type: 'error', error: `Connection closed without receiving audio data` });
    }
}

// Обробка аудіо-чанків та створення MP3
async function processAudioChunks() {
    if (audioChunks.length === 0 || isProcessing) return;
    
    try {
        isProcessing = true;
        let foundValidAudio = false;
        
        // Обробка всіх блобів - оптимізована версія
        for (let i = 0; i < audioChunks.length; i++) {
            const blob = audioChunks[i];
            const arrayBuffer = await blob.arrayBuffer();
            const chunk = new Uint8Array(arrayBuffer);
            
            // Знайти роздільник аудіо-даних
            const separatorIndex = findSeparatorIndex(chunk, dataSeparator);
            
            if (separatorIndex !== -1) {
                // Отримати тільки частину після роздільника
                const audioData = chunk.slice(separatorIndex + dataSeparator.length);
                
                if (audioData.length > 0) {
                    foundValidAudio = true;
                    
                    // Об'єднати з попередніми даними більш ефективно
                    combinedAudioData = concatUint8Arrays(combinedAudioData, audioData);
                }
            } else if (chunk.length > 0 && i > 0 && endMessageReceived) {
                // Якщо немає роздільника, але є дані і отримали Path:turn.end, це продовження аудіо
                foundValidAudio = true;
                combinedAudioData = concatUint8Arrays(combinedAudioData, chunk);
            }
        }
        
        // Перевірити, чи маємо дані для збереження
        if (combinedAudioData.length > 0 && foundValidAudio) {
            // Помічаємо що дані були оброблені
            isDataProcessed = true;
            
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
    } finally {
        isProcessing = false;
    }
}

// Більш ефективне об'єднання масивів Uint8Array
function concatUint8Arrays(a, b) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
} 