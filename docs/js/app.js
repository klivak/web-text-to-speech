/**
 * TTS Generator - Edge TTS Web Client
 * JavaScript implementation for Edge TTS API
 * Version: 1.0.1 (forced update)
 */

// Constants
const AVG_CHARS_PER_SECOND = 15; // Average characters per second for TTS estimation
const EDGE_TTS_API_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4'; // Direct API endpoint
const EDGE_TTS_SYNTHESIS_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'; // Direct API endpoint

// Create Web Worker for API requests (to bypass CORS)
let ttsWorker = null;
try {
    ttsWorker = new Worker('./js/worker.js');
    
    // Set up worker message handling
    ttsWorker.onmessage = function(event) {
        const { type, voices, audio, error, voiceInfo } = event.data;
        
        switch (type) {
            case 'voices-list':
                handleVoicesLoaded(voices);
                break;
            case 'audio-generated':
                handleAudioGenerated(audio, voiceInfo);
                break;
            case 'generation-start':
                showGenerationProgress(true);
                break;
            case 'error':
                console.error('Worker error:', error);
                updateStatus(`Помилка: ${error}`, 'danger', true);
                showGenerationProgress(false);
                break;
        }
    };
    
    ttsWorker.onerror = function(error) {
        console.error('Worker error:', error);
        updateStatus('Помилка ініціалізації TTS Worker', 'danger', true);
    };
} catch (error) {
    console.error('Failed to create Web Worker:', error);
    updateStatus('Помилка ініціалізації TTS Worker. Сучасний браузер потрібен.', 'danger', true);
}

// Language and accent data
const LANGUAGE_NAMES = {
    "en": "англійська",
    "uk": "українська",
    "ru": "російська",
    "fr": "французька",
    "de": "німецька",
    "es": "іспанська",
    "it": "італійська",
    "pt": "португальська",
    "pl": "польська",
    "nl": "нідерландська",
    "cs": "чеська",
    "sk": "словацька",
    "ja": "японська",
    "ko": "корейська",
    "zh": "китайська",
    "ar": "арабська",
    "he": "іврит",
    "tr": "турецька",
    "da": "данська",
    "sv": "шведська",
    "fi": "фінська",
    "nb": "норвезька",
    "hu": "угорська",
    "ca": "каталонська",
    "ro": "румунська",
    "hr": "хорватська",
    "el": "грецька",
    "hi": "хінді",
    "th": "тайська",
    "bg": "болгарська",
    "et": "естонська",
    "lt": "литовська",
    "lv": "латвійська",
    "sl": "словенська",
    "id": "індонезійська",
    "ms": "малайська",
    "vi": "в'єтнамська",
    "fa": "перська",
    "af": "африкаанс"
};

const ACCENT_DESCRIPTIONS = {
    "US": "США",
    "GB": "Британія",
    "AU": "Австралія",
    "CA": "Канада",
    "IN": "Індія",
    "IE": "Ірландія",
    "KE": "Кенія",
    "NG": "Нігерія",
    "NZ": "Нова Зеландія",
    "PH": "Філіппіни",
    "SG": "Сінгапур",
    "ZA": "ПАР",
    "TZ": "Танзанія",
    "ZW": "Зімбабве",
    "CH": "Швейцарія",
    "DE": "Німеччина",
    "AT": "Австрія",
    "BR": "Бразилія",
    "PT": "Португалія",
    "MX": "Мексика",
    "ES": "Іспанія",
    "CO": "Колумбія",
    "AR": "Аргентина",
    "CL": "Чилі"
};

// Sample quotes for random insertion
const QUOTES = [
    "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
    "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
    "If life were predictable it would cease to be life, and be without flavor. - Eleanor Roosevelt",
    "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough. - Oprah Winfrey",
    "Life is what happens when you're busy making other plans. - John Lennon"
];

// Global variables
let allVoices = []; // All available voices
let filteredVoices = []; // Filtered voices based on user selection
let selectedVoice = null; // Currently selected voice
let audioPlayer = null; // Audio player instance
let lastGeneratedAudio = null; // Last generated audio blob
let lastGeneratedData = null; // Last generated audio data
let generatedAudios = []; // List of all generated audios in this session
let toastCounter = 0; // Counter for unique toast IDs

// DOM Elements
const elements = {
    // Filter selectors
    languageSelect: document.getElementById('languageSelect'),
    accentSelect: document.getElementById('accentSelect'),
    genderSelect: document.getElementById('genderSelect'),
    
    // Voice list
    voicesList: document.getElementById('voicesList'),
    voicesCount: document.getElementById('voicesCount'),
    
    // Text area
    textInput: document.getElementById('textInput'),
    charCount: document.getElementById('charCount'),
    pasteBtn: document.getElementById('pasteBtn'),
    clearBtn: document.getElementById('clearBtn'),
    randomQuoteBtn: document.getElementById('randomQuoteBtn'),
    
    // Voice parameters
    rateInput: document.getElementById('rateInput'),
    volumeInput: document.getElementById('volumeInput'),
    pitchInput: document.getElementById('pitchInput'),
    incrementRate: document.getElementById('incrementRate'),
    decrementRate: document.getElementById('decrementRate'),
    incrementVolume: document.getElementById('incrementVolume'),
    decrementVolume: document.getElementById('decrementVolume'),
    incrementPitch: document.getElementById('incrementPitch'),
    decrementPitch: document.getElementById('decrementPitch'),
    
    // Control buttons
    applyFiltersBtn: document.getElementById('applyFiltersBtn'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    resetVoiceParamsBtn: document.getElementById('resetVoiceParamsBtn'),
    generateBtn: document.getElementById('generateBtn'),
    playBtn: document.getElementById('playBtn'),
    stopBtn: document.getElementById('stopBtn'),
    
    // Generation progress
    generationProgress: document.getElementById('generationProgress'),
    topPageLoader: document.getElementById('topPageLoader'),
    
    // Audio player
    playerContainer: document.getElementById('playerContainer'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    audioProgress: document.getElementById('audioProgress'),
    currentAudio: document.getElementById('currentAudio'),
    playbackSpeed: document.getElementById('playbackSpeed'),
    rewind10Btn: document.getElementById('rewind10Btn'),
    forward10Btn: document.getElementById('forward10Btn'),
    downloadAudioBtn: document.getElementById('downloadAudioBtn'),
    
    // Audio history
    audioHistory: document.getElementById('audioHistory'),
    
    // Status
    statusLog: document.getElementById('statusLog'),
    
    // Modals
    helpBtn: document.getElementById('helpBtn'),
    aboutBtn: document.getElementById('aboutBtn'),
    instructionsModal: null, // Will be initialized later
    aboutModal: null, // Will be initialized later
    
    // Additional elements
    audioSeek: document.getElementById('audioSeek'),
    
    // Notifications
    toastContainer: document.getElementById('toastContainer')
}; 

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('TTS Generator initializing...');
    
    // Initialize Bootstrap modals
    elements.instructionsModal = new bootstrap.Modal(document.getElementById('instructionsModal'));
    elements.aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'));
    
    // Set up event listeners
    setupEventListeners();
    initializeAudioPlayer();
    updateCharCount();
    
    // Load initial data
    if (ttsWorker) {
        fetchVoices().then(() => {
            updateStatus('Готовий до роботи');
        }).catch(error => {
            console.error('Error initializing app:', error);
            updateStatus('Помилка завантаження голосів. Перезавантажте сторінку.', 'danger', true);
        });
    } else {
        updateStatus('Цей браузер не підтримує Web Workers. Спробуйте інший браузер.', 'danger', true);
    }
});

/**
 * Fetch all available voices from Edge TTS API
 */
async function fetchVoices() {
    try {
        updateStatus('Завантаження голосів...', 'info');
        
        // Check if worker is available
        if (!ttsWorker) {
            throw new Error('TTS Worker not available');
        }
        
        // Request voices list from worker
        ttsWorker.postMessage({ type: 'fetch-voices' });
        
        // The actual processing is done in the worker message handler
        return true;
    } catch (error) {
        console.error('Error fetching voices:', error);
        updateStatus('Помилка завантаження голосів', 'danger', true);
        elements.voicesList.innerHTML = `
            <div class="list-group-item text-center py-5">
                <div class="text-danger mb-2"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <p>Не вдалося завантажити голоси.<br>Спробуйте оновити сторінку.</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Оновити
                </button>
            </div>
        `;
        throw error;
    }
}

/**
 * Handle loaded voices from worker
 */
function handleVoicesLoaded(voices) {
    try {
        allVoices = voices;
        console.log(`Loaded ${allVoices.length} voices from Edge TTS API`);
        
        // Filter voices to show by default
        filteredVoices = allVoices;
        
        // Update UI
        loadLanguages();
        updateStatus(`Завантажено ${allVoices.length} голосів`, 'success');
    } catch (error) {
        console.error('Error processing voices:', error);
        updateStatus('Помилка обробки голосів', 'danger', true);
    }
}

/**
 * Load languages to the language select dropdown
 */
function loadLanguages() {
    try {
        // Get unique languages from voices
        const languages = [...new Set(allVoices.map(voice => {
            const locale = voice.Locale || '';
            return locale.split('-')[0];
        }))].filter(lang => lang).sort();
        
        // Clear the language select
        elements.languageSelect.innerHTML = '';
        
        // Add "All languages" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Всі мови';
        elements.languageSelect.appendChild(allOption);
        
        // Add language options
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            const langName = LANGUAGE_NAMES[lang] || lang;
            option.textContent = `${lang} (${langName})`;
            elements.languageSelect.appendChild(option);
        });
        
        // Default to English if available
        const englishOption = Array.from(elements.languageSelect.options)
            .find(opt => opt.value === 'en');
        if (englishOption) {
            elements.languageSelect.value = 'en';
            loadAccents('en');
        }
    } catch (error) {
        console.error('Error loading languages:', error);
        updateStatus('Помилка завантаження мов', 'danger');
    }
}

/**
 * Load accents for the selected language
 * @param {string} language - Selected language code
 */
function loadAccents(language) {
    try {
        // Clear the accent select
        elements.accentSelect.innerHTML = '';
        
        // Add "All accents" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Всі акценти';
        elements.accentSelect.appendChild(allOption);
        
        if (language !== 'all') {
            // Get unique accents for this language
            const accents = [...new Set(allVoices
                .filter(voice => (voice.Locale || '').startsWith(`${language}-`))
                .map(voice => {
                    const locale = voice.Locale || '';
                    return locale.split('-')[1];
                })
            )].filter(accent => accent).sort();
            
            // Add accent options
            accents.forEach(accent => {
                const option = document.createElement('option');
                option.value = accent;
                const accentDesc = ACCENT_DESCRIPTIONS[accent] || accent;
                option.textContent = `${accent} (${accentDesc})`;
                elements.accentSelect.appendChild(option);
            });
            
            // Default to US for English
            if (language === 'en') {
                const usOption = Array.from(elements.accentSelect.options)
                    .find(opt => opt.value === 'US');
                if (usOption) {
                    elements.accentSelect.value = 'US';
                }
            }
        }
        
        // Update voices list with new filters
        filterVoices();
    } catch (error) {
        console.error('Error loading accents:', error);
        updateStatus('Помилка завантаження акцентів', 'danger');
    }
}

/**
 * Filter voices based on selected language, accent, and gender
 */
function filterVoices() {
    try {
        const language = elements.languageSelect.value;
        const accent = elements.accentSelect.value;
        const gender = elements.genderSelect.value;
        
        // Filter voices
        filteredVoices = allVoices.filter(voice => {
            // Language filter
            if (language !== 'all') {
                if (accent !== 'all') {
                    // Specific language and accent
                    const expectedLocale = `${language}-${accent}`;
                    if (voice.Locale !== expectedLocale) {
                        return false;
                    }
                } else {
                    // Any accent for this language
                    if (!(voice.Locale || '').startsWith(`${language}-`)) {
                        return false;
                    }
                }
            }
            
            // Gender filter
            if (gender !== 'all' && voice.Gender !== gender) {
                return false;
            }
            
            return true;
        });
        
        // Update UI
        updateVoicesList();
        
    } catch (error) {
        console.error('Error filtering voices:', error);
        updateStatus('Помилка фільтрації голосів', 'danger');
    }
}

/**
 * Update the voices list in the UI
 */
function updateVoicesList() {
    try {
        // Clear the voices list
        elements.voicesList.innerHTML = '';
        
        // Update count badge
        elements.voicesCount.textContent = filteredVoices.length;
        
        // Check if we have voices
        if (filteredVoices.length === 0) {
            elements.voicesList.innerHTML = `
                <div class="list-group-item text-center py-4">
                    <div class="text-muted mb-2"><i class="bi bi-emoji-frown"></i></div>
                    <p>Немає голосів, що відповідають фільтрам</p>
                    <button class="btn btn-outline-secondary btn-sm mt-2" id="resetFiltersInEmptyList">
                        <i class="bi bi-arrow-counterclockwise"></i> Скинути фільтри
                    </button>
                </div>
            `;
            
            // Add event listener to reset button in empty list
            document.getElementById('resetFiltersInEmptyList').addEventListener('click', resetFilters);
            return;
        }
        
        // Add voice options
        filteredVoices.forEach(voice => {
            const locale = voice.Locale || '';
            const localeParts = locale.split('-');
            const langCode = localeParts[0];
            const accentCode = localeParts[1] || '';
            
            const langName = LANGUAGE_NAMES[langCode] || langCode;
            const accentName = ACCENT_DESCRIPTIONS[accentCode] || accentCode;
            
            // Format the display name
            let displayName = voice.ShortName;
            let displayDetails = '';
            
            if (voice.Name) {
                // Clean up the voice name from Microsoft prefix
                const cleanName = voice.Name.replace(/Microsoft Server Speech Text to Speech Voice \(.*?\)/, '').trim();
                if (cleanName) {
                    displayName = `${voice.ShortName} - ${cleanName}`;
                }
            }
            
            if (accentCode) {
                displayDetails = `${voice.Gender}, ${langCode}-${accentCode} (${langName}, ${accentName})`;
            } else {
                displayDetails = `${voice.Gender}, ${langCode} (${langName})`;
            }
            
            // Create the list item
            const item = document.createElement('div');
            item.className = 'list-group-item voice-item';
            item.dataset.voiceId = voice.ShortName;
            
            item.innerHTML = `
                <div class="d-flex flex-column justify-content-center w-100">
                    <span class="fw-medium">${displayName}</span>
                    <small class="text-muted">${displayDetails}</small>
                </div>
            `;
            
            // Add click event listener
            item.addEventListener('click', () => selectVoice(voice));
            
            // Add to the list
            elements.voicesList.appendChild(item);
        });
        
        // If previously selected voice is in the filtered list, reselect it
        if (selectedVoice) {
            const voiceStillInList = filteredVoices.find(voice => 
                voice.ShortName === selectedVoice.ShortName);
            
            if (voiceStillInList) {
                selectVoice(voiceStillInList);
            } else {
                selectedVoice = null; // Reset selection if voice is filtered out
            }
        }
        
    } catch (error) {
        console.error('Error updating voices list:', error);
        updateStatus('Помилка оновлення списку голосів', 'danger');
    }
}

/**
 * Select a voice from the list
 * @param {Object} voice - The voice to select
 */
function selectVoice(voice) {
    try {
        // Set selected voice
        selectedVoice = voice;
        
        // Update UI
        const allItems = elements.voicesList.querySelectorAll('.voice-item');
        allItems.forEach(item => {
            if (item.dataset.voiceId === voice.ShortName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update status
        updateStatus(`Вибрано голос: ${voice.ShortName}`, 'primary');
        
        // Enable generate button
        elements.generateBtn.disabled = false;
    } catch (error) {
        console.error('Error selecting voice:', error);
        updateStatus('Помилка вибору голосу', 'danger');
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Language select
    elements.languageSelect.addEventListener('change', () => {
        const language = elements.languageSelect.value;
        loadAccents(language);
    });
    
    // Apply filters button
    elements.applyFiltersBtn.addEventListener('click', filterVoices);
    
    // Reset filters button
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Text input
    elements.textInput.addEventListener('input', updateCharCount);
    
    // Paste button
    elements.pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            elements.textInput.value = text;
            updateCharCount();
            updateStatus('Текст вставлено з буфера обміну', 'info');
        } catch (error) {
            console.error('Error pasting text:', error);
            updateStatus('Не вдалося отримати доступ до буфера обміну', 'warning', true);
        }
    });
    
    // Clear text button
    elements.clearBtn.addEventListener('click', () => {
        elements.textInput.value = '';
        updateCharCount();
        updateStatus('Текст очищено', 'info');
    });
    
    // Random quote button
    elements.randomQuoteBtn.addEventListener('click', insertRandomQuote);
    
    // Voice parameters adjustment
    elements.incrementRate.addEventListener('click', () => adjustRateValue(5));
    elements.decrementRate.addEventListener('click', () => adjustRateValue(-5));
    elements.incrementVolume.addEventListener('click', () => adjustVolumeValue(5));
    elements.decrementVolume.addEventListener('click', () => adjustVolumeValue(-5));
    elements.incrementPitch.addEventListener('click', () => adjustPitchValue(5));
    elements.decrementPitch.addEventListener('click', () => adjustPitchValue(-5));
    
    // Reset voice parameters button
    elements.resetVoiceParamsBtn.addEventListener('click', resetVoiceParams);
    
    // Generate button
    elements.generateBtn.addEventListener('click', generateAudio);
    
    // Audio player controls
    elements.playBtn.addEventListener('click', togglePlayback);
    elements.stopBtn.addEventListener('click', stopAudioPlayback);
    elements.rewind10Btn.addEventListener('click', () => seekAudio(-10));
    elements.forward10Btn.addEventListener('click', () => seekAudio(10));
    
    // Audio seek slider
    elements.audioSeek.addEventListener('input', handleAudioSeek);
    
    // Playback speed
    const speedOptions = document.querySelectorAll('.dropdown-item[data-speed]');
    speedOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            const speed = parseFloat(event.target.dataset.speed);
            setPlaybackSpeed(speed);
        });
    });
    
    // Help and About buttons
    elements.helpBtn.addEventListener('click', (event) => {
        event.preventDefault();
        elements.instructionsModal.show();
    });
    
    elements.aboutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        elements.aboutModal.show();
    });
}

/**
 * Generate audio from text using Edge TTS API
 */
async function generateAudio() {
    try {
        // Check if voice is selected
        if (!selectedVoice) {
            updateStatus('Виберіть голос для генерації аудіо', 'warning', true);
            return;
        }
        
        // Get text
        const text = elements.textInput.value.trim();
        if (!text) {
            updateStatus('Введіть текст для озвучення', 'warning', true);
            return;
        }
        
        // Stop current playback if any
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            elements.playBtn.innerHTML = '<i class="bi bi-play-fill"></i> Відтворити';
            elements.playBtn.disabled = true;
            elements.stopBtn.disabled = true;
        }
        
        // Get parameters
        const rate = elements.rateInput.value;
        const volume = elements.volumeInput.value;
        const pitch = elements.pitchInput.value;
        
        // Show progress indicators
        showGenerationProgress(true);
        updateStatus(`Генерація аудіо з голосом ${selectedVoice.ShortName}...`, 'info');
        
        // Make sure the text doesn't contain the error message itself
        const cleanText = text.replace(/Failed to load resource|Error generating audio|Bad Request/g, '');
        
        // Set up SSML for Edge TTS
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${selectedVoice.Locale}">
            <voice name="${selectedVoice.ShortName}">
                <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
                    ${escapeXml(cleanText)}
                </prosody>
            </voice>
        </speak>`;
        
        console.log('Generating audio with SSML:', ssml);
        
        // Start time for measuring generation time
        window.generationStartTime = performance.now();
        
        // Check if worker is available
        if (!ttsWorker) {
            throw new Error('TTS Worker not available');
        }
        
        // Send request to worker
        ttsWorker.postMessage({
            type: 'generate-audio',
            data: {
                ssml: ssml,
                voice: selectedVoice
            }
        });
        
        // The actual processing will continue in the worker message handler
    } catch (error) {
        console.error('Error generating audio:', error);
        showGenerationProgress(false);
        updateStatus(`Помилка генерації аудіо: ${error.message}`, 'danger', true);
    }
}

/**
 * Show or hide generation progress indicators
 */
function showGenerationProgress(show) {
    if (show) {
        elements.generationProgress.classList.remove('d-none');
        elements.topPageLoader.classList.remove('d-none');
        elements.generateBtn.disabled = true;
    } else {
        elements.generationProgress.classList.add('d-none');
        elements.topPageLoader.classList.add('d-none');
        elements.generateBtn.disabled = false;
    }
}

/**
 * Handle generated audio from worker
 */
function handleAudioGenerated(audioBuffer, voiceInfo) {
    try {
        // Calculate generation time
        const generationTime = ((performance.now() - window.generationStartTime) / 1000).toFixed(2);
        
        // Create blob from array buffer
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
        
        // Create object URL for the audio blob
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create filename based on timestamp and voice
        const timestamp = Date.now();
        const voiceShortName = selectedVoice.ShortName.replace(/-/g, '_');
        const filename = `tts_${voiceShortName}_${timestamp}.mp3`;
        
        // Create audio data object
        const audioData = {
            url: audioUrl,
            blob: audioBlob,
            filename: filename,
            voice: selectedVoice.ShortName,
            voiceDisplayName: selectedVoice.Name || selectedVoice.ShortName,
            text: elements.textInput.value.substring(0, 100) + (elements.textInput.value.length > 100 ? '...' : ''),
            time: new Date().toISOString(),
            size: audioBlob.size,
            generationTime: generationTime,
            parameters: {
                rate: elements.rateInput.value,
                volume: elements.volumeInput.value,
                pitch: elements.pitchInput.value
            }
        };
        
        // Save the generated audio data
        lastGeneratedAudio = audioUrl;
        lastGeneratedData = audioData;
        
        // Add to generated audios list (keep most recent 20)
        generatedAudios.unshift(audioData);
        if (generatedAudios.length > 20) {
            // Revoke old blob URLs to prevent memory leaks
            URL.revokeObjectURL(generatedAudios.pop().url);
        }
        
        // Update UI
        showGenerationProgress(false);
        
        // Update download button
        elements.downloadAudioBtn.href = audioUrl;
        elements.downloadAudioBtn.download = filename;
        
        // Update player info
        elements.currentAudio.textContent = `${filename} (${selectedVoice.ShortName})`;
        elements.playerContainer.classList.remove('d-none');
        
        // Enable playback controls
        elements.playBtn.disabled = false;
        
        // Update the audio history display
        updateAudioHistory();
        
        // Show success message
        updateStatus(`Аудіо згенеровано (${generationTime} сек). Натисніть "Відтворити" для прослуховування.`, 'success', true);
        
    } catch (error) {
        console.error('Error processing generated audio:', error);
        showGenerationProgress(false);
        updateStatus(`Помилка обробки згенерованого аудіо: ${error.message}`, 'danger', true);
    }
}

/**
 * Update the audio history display
 */
function updateAudioHistory() {
    try {
        // Clear history if no generated audios
        if (generatedAudios.length === 0) {
            elements.audioHistory.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-3">
                        <p>Немає згенерованих аудіофайлів</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Create HTML for audio history
        let historyHtml = '';
        
        generatedAudios.forEach((audio, index) => {
            const isLatest = index === 0;
            const formatDate = new Date(audio.time).toLocaleString();
            const formattedSize = formatFileSize(audio.size);
            
            historyHtml += `
                <tr${isLatest ? ' class="highlight-new"' : ''}>
                    <td>
                        <div class="audio-filename" title="${audio.filename}">${audio.filename}</div>
                        <small class="text-muted d-block">${audio.voice}</small>
                    </td>
                    <td>${formattedSize}</td>
                    <td>${formatDate}</td>
                    <td class="audio-history-actions">
                        <button class="btn btn-sm btn-outline-primary play-history-btn" data-index="${index}">
                            <i class="bi bi-play-fill"></i>
                        </button>
                        <a href="${audio.url}" download="${audio.filename}" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-download"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
        
        elements.audioHistory.innerHTML = historyHtml;
        
        // Add event listeners to play buttons
        const playButtons = document.querySelectorAll('.play-history-btn');
        playButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                if (generatedAudios[index]) {
                    playAudio(generatedAudios[index].url);
                    elements.currentAudio.textContent = `${generatedAudios[index].filename} (${generatedAudios[index].voice})`;
                    elements.playerContainer.classList.remove('d-none');
                }
            });
        });
        
    } catch (error) {
        console.error('Error updating audio history:', error);
        updateStatus('Помилка оновлення історії аудіо', 'danger');
    }
}

/**
 * Initialize the audio player
 */
function initializeAudioPlayer() {
    // Audio player is created on demand when playing audio
    
    // Set up drag functionality for audio seek
    elements.audioSeek.dragging = false;
    
    elements.audioSeek.addEventListener('mousedown', () => {
        elements.audioSeek.dragging = true;
    });
    
    document.addEventListener('mouseup', () => {
        if (elements.audioSeek.dragging) {
            elements.audioSeek.dragging = false;
            if (audioPlayer) {
                audioPlayer.currentTime = elements.audioSeek.value;
            }
        }
    });
}

/**
 * Play audio from a URL
 * @param {string} url - The URL of the audio to play
 */
function playAudio(url) {
    try {
        // Stop current playback if any
        if (audioPlayer) {
            audioPlayer.pause();
        }
        
        // Create new audio player
        audioPlayer = new Audio(url);
        
        // Set up event listeners
        audioPlayer.addEventListener('loadedmetadata', () => {
            elements.duration.textContent = formatTime(audioPlayer.duration);
            elements.audioSeek.max = audioPlayer.duration;
            elements.audioSeek.value = 0;
        });
        
        audioPlayer.addEventListener('timeupdate', () => {
            elements.currentTime.textContent = formatTime(audioPlayer.currentTime);
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            elements.audioProgress.style.width = `${progress}%`;
            
            if (!elements.audioSeek.dragging) {
                elements.audioSeek.value = audioPlayer.currentTime;
            }
        });
        
        audioPlayer.addEventListener('ended', () => {
            elements.playBtn.innerHTML = '<i class="bi bi-play-fill"></i> Відтворити';
            elements.playBtn.disabled = false;
            elements.stopBtn.disabled = true;
            updateStatus('Відтворення завершено');
        });
        
        audioPlayer.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            updateStatus('Помилка відтворення аудіо', 'danger', true);
        });
        
        // Start playback
        audioPlayer.play().then(() => {
            elements.playBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Пауза';
            elements.stopBtn.disabled = false;
            updateStatus('Відтворення аудіо');
        }).catch(error => {
            console.error('Error starting playback:', error);
            updateStatus('Помилка запуску відтворення', 'danger', true);
        });
        
    } catch (error) {
        console.error('Error playing audio:', error);
        updateStatus('Помилка відтворення аудіо', 'danger', true);
    }
}

/**
 * Toggle audio playback (play/pause)
 */
function togglePlayback() {
    if (!audioPlayer && lastGeneratedAudio) {
        playAudio(lastGeneratedAudio);
        return;
    }
    
    if (!audioPlayer) {
        updateStatus('Немає аудіо для відтворення', 'warning');
        return;
    }
    
    if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
            elements.playBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Пауза';
            elements.stopBtn.disabled = false;
        });
    } else {
        audioPlayer.pause();
        elements.playBtn.innerHTML = '<i class="bi bi-play-fill"></i> Відтворити';
    }
}

/**
 * Stop audio playback
 */
function stopAudioPlayback() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        elements.playBtn.innerHTML = '<i class="bi bi-play-fill"></i> Відтворити';
        elements.stopBtn.disabled = true;
        elements.audioProgress.style.width = '0%';
        elements.audioSeek.value = 0;
        elements.currentTime.textContent = '0:00';
    }
}

/**
 * Seek audio by a specified amount of seconds
 * @param {number} seconds - The number of seconds to seek (positive or negative)
 */
function seekAudio(seconds) {
    if (audioPlayer) {
        let newTime = audioPlayer.currentTime + seconds;
        newTime = Math.max(0, Math.min(newTime, audioPlayer.duration));
        audioPlayer.currentTime = newTime;
    }
}

/**
 * Handle audio seek slider input
 */
function handleAudioSeek() {
    if (audioPlayer) {
        elements.currentTime.textContent = formatTime(elements.audioSeek.value);
        const progress = (elements.audioSeek.value / audioPlayer.duration) * 100;
        elements.audioProgress.style.width = `${progress}%`;
    }
}

/**
 * Set playback speed
 * @param {number} speed - The playback speed (0.5, 0.75, 1.0, 1.25, 1.5, 2.0)
 */
function setPlaybackSpeed(speed) {
    if (audioPlayer) {
        audioPlayer.playbackRate = speed;
    }
    
    elements.playbackSpeed.textContent = `${speed}x`;
}

/**
 * Update character count and estimated time
 */
function updateCharCount() {
    const text = elements.textInput.value;
    const charCount = text.length;
    
    // Format the character count with thousands separator
    const formattedCount = charCount.toLocaleString();
    
    // Calculate approximate time based on character count
    const approxTime = Math.round(charCount / AVG_CHARS_PER_SECOND);
    
    // Format time as minutes and seconds if over 60 seconds
    let timeStr;
    if (approxTime >= 60) {
        const mins = Math.floor(approxTime / 60);
        const secs = approxTime % 60;
        timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        timeStr = `${approxTime} сек`;
    }
    
    elements.charCount.textContent = `Символів: ${formattedCount} | Приблизний час озвучення тексту: ${timeStr}`;
}

/**
 * Update status message
 * @param {string} message - The status message
 * @param {string} type - Bootstrap alert type (primary, secondary, success, danger, warning, info)
 * @param {boolean} showNotification - Whether to show a toast notification
 */
function updateStatus(message, type = 'secondary', showNotification = false) {
    // Update status log
    elements.statusLog.className = `alert alert-${type}`;
    elements.statusLog.textContent = message;
    
    // Show toast notification if requested
    if (showNotification) {
        showToast(message, type);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The toast message
 * @param {string} type - Bootstrap alert type (primary, secondary, success, danger, warning, info)
 */
function showToast(message, type = 'secondary') {
    try {
        // Create a unique ID for this toast
        const toastId = `toast-${++toastCounter}`;
        
        // Create toast element
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto text-${type}">
                        <i class="bi ${getIconForType(type)}"></i>
                        ${getTextForType(type)}
                    </strong>
                    <small>Щойно</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // Add toast to container
        elements.toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Get the toast element
        const toastElement = document.getElementById(toastId);
        
        // Initialize the Bootstrap toast
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        // Show the toast
        toast.show();
        
        // Remove the toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}

/**
 * Reset voice parameters to default
 */
function resetVoiceParams() {
    elements.rateInput.value = '+0%';
    elements.volumeInput.value = '+0%';
    elements.pitchInput.value = '+0Hz';
    updateStatus('Параметри голосу скинуто до стандартних', 'info');
}

/**
 * Reset all filters
 */
function resetFilters() {
    elements.languageSelect.value = 'all';
    loadAccents('all');
    elements.genderSelect.value = 'all';
    filterVoices();
    updateStatus('Фільтри скинуто', 'info');
}

/**
 * Insert a random quote into the text input
 */
function insertRandomQuote() {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    elements.textInput.value = QUOTES[randomIndex];
    updateCharCount();
    updateStatus('Випадкову цитату вставлено', 'info');
}

/**
 * Adjust rate value by a specified increment
 * @param {number} increment - The increment value
 */
function adjustRateValue(increment) {
    let currentRate = elements.rateInput.value;
    
    // Parse the current value
    let numericValue = parseInt(currentRate.replace(/[^-\d]/g, '')) || 0;
    
    // Apply increment
    numericValue += increment;
    
    // Clamp to reasonable values
    numericValue = Math.max(-50, Math.min(100, numericValue));
    
    // Format the result
    const sign = numericValue >= 0 ? '+' : '';
    elements.rateInput.value = `${sign}${numericValue}%`;
}

/**
 * Adjust volume value by a specified increment
 * @param {number} increment - The increment value
 */
function adjustVolumeValue(increment) {
    let currentVolume = elements.volumeInput.value;
    
    // Parse the current value
    let numericValue = parseInt(currentVolume.replace(/[^-\d]/g, '')) || 0;
    
    // Apply increment
    numericValue += increment;
    
    // Clamp to reasonable values
    numericValue = Math.max(-50, Math.min(100, numericValue));
    
    // Format the result
    const sign = numericValue >= 0 ? '+' : '';
    elements.volumeInput.value = `${sign}${numericValue}%`;
}

/**
 * Adjust pitch value by a specified increment
 * @param {number} increment - The increment value
 */
function adjustPitchValue(increment) {
    let currentPitch = elements.pitchInput.value;
    
    // Parse the current value
    const isPitchHz = currentPitch.endsWith('Hz');
    let numericValue = parseInt(currentPitch.replace(/[^-\d]/g, '')) || 0;
    
    // Apply increment
    numericValue += increment;
    
    // Clamp to reasonable values for Hz
    if (isPitchHz) {
        numericValue = Math.max(-50, Math.min(50, numericValue));
    } else {
        numericValue = Math.max(-10, Math.min(10, numericValue));
    }
    
    // Format the result
    const sign = numericValue >= 0 ? '+' : '';
    const unit = isPitchHz ? 'Hz' : 'st';
    elements.pitchInput.value = `${sign}${numericValue}${unit}`;
}

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get icon class for toast notification based on alert type
 * @param {string} type - Bootstrap alert type
 * @returns {string} Icon class
 */
function getIconForType(type) {
    switch (type) {
        case 'success': return 'bi-check-circle-fill';
        case 'danger': return 'bi-x-circle-fill';
        case 'warning': return 'bi-exclamation-triangle-fill';
        case 'info': return 'bi-info-circle-fill';
        default: return 'bi-bell-fill';
    }
}

/**
 * Get text label for toast notification based on alert type
 * @param {string} type - Bootstrap alert type
 * @returns {string} Text label
 */
function getTextForType(type) {
    switch (type) {
        case 'success': return 'Успіх';
        case 'danger': return 'Помилка';
        case 'warning': return 'Увага';
        case 'info': return 'Інформація';
        default: return 'Повідомлення';
    }
}

/**
 * Escape XML special characters in a string
 * @param {string} text - The text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
} 