// Edge TTS Web Worker
// This worker handles API requests to bypass CORS limitations

// Base API URLs
const VOICES_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SYNTHESIS_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud';

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

// Fetch available voices
async function fetchVoices() {
    try {
        const response = await fetch(VOICES_API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51',
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                'Referer': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold/reader.html'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching voices: ${response.status} ${response.statusText}`);
        }
        
        const voices = await response.json();
        self.postMessage({ type: 'voices-list', voices });
    } catch (error) {
        self.postMessage({ type: 'error', error: `Failed to fetch voices: ${error.message}` });
    }
}

// Generate audio from SSML
async function generateAudio(data) {
    try {
        const { ssml, voice } = data;
        
        // Send start message
        self.postMessage({ type: 'generation-start' });
        
        // Make request to Edge TTS API
        const response = await fetch(SYNTHESIS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51',
                'Accept': 'audio/mp3',
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                'Referer': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold/reader.html',
                'Connection-Id': 'speech-connection-' + Date.now(),
                'X-Search-ClientId': '7D8FA3AC47D6493D89F29B3FAE4A8ADE'
            },
            body: ssml
        });
        
        if (!response.ok) {
            throw new Error(`Error generating audio: ${response.status} ${response.statusText}`);
        }
        
        // Get audio data as array buffer
        const audioData = await response.arrayBuffer();
        
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