/**
 * TTS Generator - Edge TTS Web Client
 * JavaScript implementation for Edge TTS API
 */

// Constants
const AVG_CHARS_PER_SECOND = 15; // Average characters per second for TTS estimation
const CORS_PROXY = ''; // Empty in development mode, will be replaced in builds
const EDGE_TTS_API_URL = '/api/voices'; // Use local proxy endpoint
const EDGE_TTS_SYNTHESIS_URL = '/api/synthesize'; // Use local proxy endpoint

// Language and accent data
const LANGUAGE_NAMES = {
    "af": "африкаанс",
    "am": "амхарська",
    "ar": "арабська",
    "as": "асамська",
    "az": "азербайджанська",
    "be": "білоруська",
    "bg": "болгарська",
    "bn": "бенгальська",
    "bo": "тибетська",
    "bs": "боснійська",
    "ca": "каталонська",
    "cs": "чеська",
    "cy": "валлійська",
    "da": "данська",
    "de": "німецька",
    "dv": "дивехі",
    "el": "грецька",
    "en": "англійська",
    "es": "іспанська",
    "et": "естонська",
    "eu": "баскська",
    "fa": "перська",
    "fi": "фінська",
    "fo": "фарерська",
    "fr": "французька",
    "ga": "ірландська",
    "gd": "шотландська гельська",
    "gl": "галісійська",
    "gu": "гуджараті",
    "ha": "хауса",
    "he": "іврит",
    "hi": "хінді",
    "hr": "хорватська",
    "hsb": "верхньолужицька",
    "hu": "угорська",
    "hy": "вірменська",
    "id": "індонезійська",
    "ig": "ігбо",
    "is": "ісландська",
    "it": "італійська",
    "ja": "японська",
    "jv": "яванська",
    "ka": "грузинська",
    "kk": "казахська",
    "km": "кхмерська",
    "kn": "каннада",
    "ko": "корейська",
    "ku": "курдська",
    "ky": "киргизька",
    "lo": "лаоська",
    "lt": "литовська",
    "lv": "латвійська",
    "mg": "малагасійська",
    "mk": "македонська",
    "ml": "малаялам",
    "mn": "монгольська",
    "mr": "маратхі",
    "ms": "малайська",
    "mt": "мальтійська",
    "my": "бірманська",
    "nb": "норвезька (букмол)",
    "ne": "непальська",
    "nl": "нідерландська",
    "nn": "норвезька (нюношк)",
    "no": "норвезька",
    "or": "орія",
    "pa": "панджабі",
    "pl": "польська",
    "ps": "пушту",
    "pt": "португальська",
    "ro": "румунська",
    "ru": "російська",
    "rw": "кіньяруанда",
    "si": "сингальська",
    "sk": "словацька",
    "sl": "словенська",
    "so": "сомалійська",
    "sq": "албанська",
    "sr": "сербська",
    "su": "сунданська",
    "sv": "шведська",
    "sw": "суахілі",
    "ta": "тамільська",
    "te": "телугу",
    "th": "тайська",
    "tk": "туркменська",
    "tl": "тагальська",
    "tr": "турецька",
    "tt": "татарська",
    "uk": "українська",
    "ur": "урду",
    "uz": "узбецька",
    "vi": "в'єтнамська",
    "xh": "коса",
    "yo": "йоруба",
    "zh": "китайська",
    "zu": "зулу"
};

const LANGUAGE_FLAGS = {
    "af": "za", // Південна Африка
    "am": "et", // Ефіопія
    "ar": "sa", // Саудівська Аравія
    "as": "in", // Індія
    "az": "az", // Азербайджан
    "be": "by", // Білорусь
    "bg": "bg", // Болгарія
    "bn": "bd", // Бангладеш
    "bo": "cn", // Китай (Тибет)
    "bs": "ba", // Боснія і Герцеговина
    "ca": "es", // Іспанія (Каталонія)
    "cs": "cz", // Чехія
    "cy": "gb-wls", // Уельс
    "da": "dk", // Данія
    "de": "de", // Німеччина
    "dv": "mv", // Мальдіви
    "el": "gr", // Греція
    "en": "us", // США
    "es": "es", // Іспанія
    "et": "ee", // Естонія
    "eu": "es", // Іспанія (Країна Басків)
    "fa": "ir", // Іран
    "fi": "fi", // Фінляндія
    "fo": "fo", // Фарерські острови
    "fr": "fr", // Франція
    "ga": "ie", // Ірландія
    "gd": "gb-sct", // Шотландія
    "gl": "es", // Іспанія (Галісія)
    "gu": "in", // Індія
    "ha": "ng", // Нігерія
    "he": "il", // Ізраїль
    "hi": "in", // Індія
    "hr": "hr", // Хорватія
    "hsb": "de", // Німеччина
    "hu": "hu", // Угорщина
    "hy": "am", // Вірменія
    "id": "id", // Індонезія
    "ig": "ng", // Нігерія
    "is": "is", // Ісландія
    "it": "it", // Італія
    "ja": "jp", // Японія
    "jv": "id", // Індонезія
    "ka": "ge", // Грузія
    "kk": "kz", // Казахстан
    "km": "kh", // Камбоджа
    "kn": "in", // Індія
    "ko": "kr", // Південна Корея
    "ku": "tr", // Туреччина
    "ky": "kg", // Киргизстан
    "lo": "la", // Лаос
    "lt": "lt", // Литва
    "lv": "lv", // Латвія
    "mg": "mg", // Мадагаскар
    "mk": "mk", // Північна Македонія
    "ml": "in", // Індія
    "mn": "mn", // Монголія
    "mr": "in", // Індія
    "ms": "my", // Малайзія
    "mt": "mt", // Мальта
    "my": "mm", // М'янма
    "nb": "no", // Норвегія
    "ne": "np", // Непал
    "nl": "nl", // Нідерланди
    "nn": "no", // Норвегія
    "no": "no", // Норвегія
    "or": "in", // Індія
    "pa": "in", // Індія
    "pl": "pl", // Польща
    "ps": "af", // Афганістан
    "pt": "pt", // Португалія
    "ro": "ro", // Румунія
    "ru": "ru", // Росія
    "rw": "rw", // Руанда
    "si": "lk", // Шрі-Ланка
    "sk": "sk", // Словаччина
    "sl": "si", // Словенія
    "so": "so", // Сомалі
    "sq": "al", // Албанія
    "sr": "rs", // Сербія
    "su": "id", // Індонезія
    "sv": "se", // Швеція
    "sw": "tz", // Танзанія
    "ta": "in", // Індія
    "te": "in", // Індія
    "th": "th", // Таїланд
    "tk": "tm", // Туркменістан
    "tl": "ph", // Філіппіни
    "tr": "tr", // Туреччина
    "tt": "ru", // Росія (Татарстан)
    "uk": "ua", // Україна
    "ur": "pk", // Пакистан
    "uz": "uz", // Узбекистан
    "vi": "vn", // В'єтнам
    "xh": "za", // Південна Африка
    "yo": "ng", // Нігерія
    "zh": "cn", // Китай
    "zu": "za"  // Південна Африка
};

// Country flags for accents/regions
const ACCENT_FLAGS = {
    "US": "us", // United States
    "GB": "gb", // Great Britain
    "AU": "au", // Australia
    "CA": "ca", // Canada
    "IE": "ie", // Ireland
    "NZ": "nz", // New Zealand
    "ZA": "za", // South Africa
    "IN": "in", // India
    "SG": "sg", // Singapore
    "HK": "hk", // Hong Kong
    "PH": "ph", // Philippines
    "MY": "my", // Malaysia
    "NG": "ng", // Nigeria
    "KE": "ke", // Kenya
    "GH": "gh", // Ghana
    "TZ": "tz", // Tanzania
    "UG": "ug", // Uganda
    "ZW": "zw", // Zimbabwe
    "BW": "bw", // Botswana
    "ZM": "zm", // Zambia
    "MW": "mw", // Malawi
    "SZ": "sz", // Swaziland
    "LS": "ls", // Lesotho
    "NA": "na", // Namibia
    "FR": "fr", // France
    "BE": "be", // Belgium
    "CH": "ch", // Switzerland
    "LU": "lu", // Luxembourg
    "MC": "mc", // Monaco
    "SN": "sn", // Senegal
    "CI": "ci", // Ivory Coast
    "ML": "ml", // Mali
    "BF": "bf", // Burkina Faso
    "NE": "ne", // Niger
    "TD": "td", // Chad
    "CM": "cm", // Cameroon
    "CF": "cf", // Central African Republic
    "GA": "ga", // Gabon
    "CG": "cg", // Congo
    "CD": "cd", // Democratic Republic of Congo
    "MG": "mg", // Madagascar
    "MU": "mu", // Mauritius
    "SC": "sc", // Seychelles
    "KM": "km", // Comoros
    "DJ": "dj", // Djibouti
    "DE": "de", // Germany
    "AT": "at", // Austria
    "LI": "li", // Liechtenstein
    "ES": "es", // Spain
    "MX": "mx", // Mexico
    "AR": "ar", // Argentina
    "CO": "co", // Colombia
    "PE": "pe", // Peru
    "VE": "ve", // Venezuela
    "CL": "cl", // Chile
    "EC": "ec", // Ecuador
    "BO": "bo", // Bolivia
    "PY": "py", // Paraguay
    "UY": "uy", // Uruguay
    "CR": "cr", // Costa Rica
    "PA": "pa", // Panama
    "GT": "gt", // Guatemala
    "HN": "hn", // Honduras
    "SV": "sv", // El Salvador
    "NI": "ni", // Nicaragua
    "CU": "cu", // Cuba
    "DO": "do", // Dominican Republic
    "PR": "pr", // Puerto Rico
    "GQ": "gq", // Equatorial Guinea
    "IT": "it", // Italy
    "SM": "sm", // San Marino
    "VA": "va", // Vatican
    "PT": "pt", // Portugal
    "BR": "br", // Brazil
    "AO": "ao", // Angola
    "MZ": "mz", // Mozambique
    "CV": "cv", // Cape Verde
    "GW": "gw", // Guinea-Bissau
    "ST": "st", // São Tomé and Príncipe
    "TL": "tl", // East Timor
    "RU": "ru", // Russia
    "BY": "by", // Belarus
    "KZ": "kz", // Kazakhstan
    "KG": "kg", // Kyrgyzstan
    "TJ": "tj", // Tajikistan
    "TM": "tm", // Turkmenistan
    "UZ": "uz", // Uzbekistan
    "MD": "md", // Moldova
    "UA": "ua", // Ukraine
    "CN": "cn", // China
    "TW": "tw", // Taiwan
    "MO": "mo", // Macau
    "JP": "jp", // Japan
    "KR": "kr", // South Korea
    "KP": "kp", // North Korea
    "MN": "mn", // Mongolia
    "TH": "th", // Thailand
    "VN": "vn", // Vietnam
    "LA": "la", // Laos
    "KH": "kh", // Cambodia
    "MM": "mm", // Myanmar
    "ID": "id", // Indonesia
    "BN": "bn", // Brunei
    "PK": "pk", // Pakistan
    "AF": "af", // Afghanistan
    "IR": "ir", // Iran
    "IQ": "iq", // Iraq
    "SY": "sy", // Syria
    "LB": "lb", // Lebanon
    "JO": "jo", // Jordan
    "IL": "il", // Israel
    "PS": "ps", // Palestine
    "SA": "sa", // Saudi Arabia
    "AE": "ae", // UAE
    "QA": "qa", // Qatar
    "BH": "bh", // Bahrain
    "KW": "kw", // Kuwait
    "OM": "om", // Oman
    "YE": "ye", // Yemen
    "TR": "tr", // Turkey
    "CY": "cy", // Cyprus
    "GE": "ge", // Georgia
    "AM": "am", // Armenia
    "AZ": "az", // Azerbaijan
    "GR": "gr", // Greece
    "MK": "mk", // Macedonia
    "AL": "al", // Albania
    "ME": "me", // Montenegro
    "RS": "rs", // Serbia
    "BA": "ba", // Bosnia and Herzegovina
    "HR": "hr", // Croatia
    "SI": "si", // Slovenia
    "HU": "hu", // Hungary
    "RO": "ro", // Romania
    "BG": "bg", // Bulgaria
    "CZ": "cz", // Czech Republic
    "SK": "sk", // Slovakia
    "PL": "pl", // Poland
    "LT": "lt", // Lithuania
    "LV": "lv", // Latvia
    "EE": "ee", // Estonia
    "FI": "fi", // Finland
    "SE": "se", // Sweden
    "NO": "no", // Norway
    "DK": "dk", // Denmark
    "IS": "is", // Iceland
    "FO": "fo", // Faroe Islands
    "GL": "gl", // Greenland
    "NL": "nl", // Netherlands
    "AW": "aw", // Aruba
    "CW": "cw", // Curaçao
    "SX": "sx", // Sint Maarten
    "SR": "sr", // Suriname
    "ET": "et", // Ethiopia
    "ER": "er", // Eritrea
    "SO": "so", // Somalia
    "DZ": "dz", // Algeria
    "MA": "ma", // Morocco
    "TN": "tn", // Tunisia
    "LY": "ly", // Libya
    "EG": "eg", // Egypt
    "SD": "sd", // Sudan
    "SS": "ss", // South Sudan
    "LK": "lk", // Sri Lanka
    "MV": "mv", // Maldives
    "NP": "np", // Nepal
    "BT": "bt", // Bhutan
    "BD": "bd", // Bangladesh
    "FJ": "fj", // Fiji
    "PG": "pg", // Papua New Guinea
    "SB": "sb", // Solomon Islands
    "VU": "vu", // Vanuatu
    "NC": "nc", // New Caledonia
    "PF": "pf", // French Polynesia
    "WS": "ws", // Samoa
    "TO": "to", // Tonga
    "KI": "ki", // Kiribati
    "TV": "tv", // Tuvalu
    "NR": "nr", // Nauru
    "PW": "pw", // Palau
    "FM": "fm", // Micronesia
    "MH": "mh", // Marshall Islands
    "CK": "ck", // Cook Islands
    "NU": "nu", // Niue
    "TK": "tk", // Tokelau
    "WF": "wf", // Wallis and Futuna
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
    // Filter selectors - Custom Language Select
    languageSelect: document.getElementById('languageSelect'),
    languageSelectTrigger: document.querySelector('#languageSelect .custom-select-trigger'),
    languageSelectValue: document.querySelector('#languageSelect .custom-select-value'),
    languageSelectDropdown: document.querySelector('#languageSelect .custom-select-dropdown'),
    languageOptions: document.getElementById('languageOptions'),
    languageSearch: document.getElementById('languageSearch'),
    
    // Custom Accent Select
    accentSelect: document.getElementById('accentSelect'),
    accentSelectTrigger: document.querySelector('#accentSelect .custom-select-trigger'),
    accentSelectValue: document.querySelector('#accentSelect .custom-select-value'),
    accentSelectDropdown: document.querySelector('#accentSelect .custom-select-dropdown'),
    accentOptions: document.getElementById('accentOptions'),
    accentSearch: document.getElementById('accentSearch'),
    
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
    
    // Load initial data
    fetchVoices().then(() => {
        loadLanguages();
        setupEventListeners();
        initializeAudioPlayer();
        updateCharCount();
        updateStatus('Готовий до роботи');
    }).catch(error => {
        console.error('Error initializing app:', error);
        updateStatus('Помилка завантаження голосів. Перезавантажте сторінку.', 'danger', true);
    });
});

/**
 * Fetch all available voices from Edge TTS API
 */
async function fetchVoices() {
    try {
        updateStatus('Завантаження голосів...', 'info');
        
        const response = await fetch(EDGE_TTS_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        allVoices = await response.json();
        console.log(`Loaded ${allVoices.length} voices from Edge TTS API`);
        
        // Filter voices to show by default
        filteredVoices = allVoices;
        
        // Update status
        updateStatus(`Завантажено ${allVoices.length} голосів`, 'success');
        return allVoices;
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

// Global variables to store current selections
let currentLanguage = 'all';
let currentAccent = 'all';

/**
 * Load languages to the custom language select dropdown
 */
function loadLanguages() {
    try {
        // Get unique languages from voices
        const languages = [...new Set(allVoices.map(voice => {
            const locale = voice.Locale || '';
            return locale.split('-')[0];
        }))].filter(lang => lang).sort();
        
        // Update label with language count
        const languageLabel = document.querySelector('label[for="languageSelect"]');
        if (languageLabel) {
            languageLabel.textContent = `Мова: (${languages.length})`;
        }
        
        // Clear the language options
        elements.languageOptions.innerHTML = '';
        
        // Add "All languages" option
        const allOption = document.createElement('div');
        allOption.className = 'custom-select-option';
        allOption.dataset.value = 'all';
        allOption.innerHTML = `<span class="fi fi-globe"></span> Всі мови`;
        elements.languageOptions.appendChild(allOption);
        
        // Add English first if it exists
        if (languages.includes('en')) {
            const enOption = document.createElement('div');
            enOption.className = 'custom-select-option';
            enOption.dataset.value = 'en';
            
            const langName = LANGUAGE_NAMES['en'] || 'en';
            const flagCode = LANGUAGE_FLAGS['en'];
            
            if (flagCode) {
                enOption.innerHTML = `<span class="fi fi-${flagCode}"></span> EN (${langName})`;
            } else {
                enOption.innerHTML = `🌐 EN (${langName})`;
            }
            
            elements.languageOptions.appendChild(enOption);
        }
        
        // Add other language options (excluding English since it's already added)
        languages.filter(lang => lang !== 'en').forEach(lang => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = lang;
            
            const langName = LANGUAGE_NAMES[lang] || lang;
            const flagCode = LANGUAGE_FLAGS[lang];
            
            if (flagCode) {
                option.innerHTML = `<span class="fi fi-${flagCode}"></span> ${lang.toUpperCase()} (${langName})`;
            } else {
                option.innerHTML = `🌐 ${lang.toUpperCase()} (${langName})`;
            }
            
            elements.languageOptions.appendChild(option);
        });
        
        // Set default to English if available
        const englishExists = languages.includes('en');
        if (englishExists) {
            selectLanguage('en');
        } else {
            selectLanguage('all');
        }
        
        // Setup custom select functionality
        setupCustomLanguageSelect();
        
    } catch (error) {
        console.error('Error loading languages:', error);
        updateStatus('Помилка завантаження мов', 'danger');
    }
}

/**
 * Setup custom language select functionality
 */
function setupCustomLanguageSelect() {
    // Toggle dropdown
    elements.languageSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLanguageDropdown();
    });
    
    // Handle option selection
    elements.languageOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-select-option');
        if (option) {
            const value = option.dataset.value;
            selectLanguage(value);
            closeLanguageDropdown();
        }
    });
    
    // Search functionality
    elements.languageSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterLanguageOptions(searchTerm);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.languageSelect.contains(e.target)) {
            closeLanguageDropdown();
        }
    });
    
    // Handle keyboard navigation
    elements.languageSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLanguageDropdown();
        }
    });
}

/**
 * Toggle language dropdown visibility
 */
function toggleLanguageDropdown() {
    const isOpen = elements.languageSelectDropdown.classList.contains('show');
    if (isOpen) {
        closeLanguageDropdown();
    } else {
        openLanguageDropdown();
    }
}

/**
 * Open language dropdown
 */
function openLanguageDropdown() {
    elements.languageSelectDropdown.classList.add('show');
    elements.languageSelectTrigger.classList.add('active');
    elements.languageSearch.focus();
    elements.languageSearch.value = '';
    filterLanguageOptions('');
}

/**
 * Close language dropdown
 */
function closeLanguageDropdown() {
    elements.languageSelectDropdown.classList.remove('show');
    elements.languageSelectTrigger.classList.remove('active');
}

/**
 * Filter language options based on search term
 */
function filterLanguageOptions(searchTerm) {
    const options = elements.languageOptions.querySelectorAll('.custom-select-option');
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        const value = option.dataset.value.toLowerCase();
        const matches = text.includes(searchTerm) || value.includes(searchTerm);
        option.classList.toggle('hidden', !matches);
    });
}

/**
 * Select a language option
 */
function selectLanguage(value) {
    currentLanguage = value;
    
    // Update UI
    const selectedOption = elements.languageOptions.querySelector(`[data-value="${value}"]`);
    if (selectedOption) {
        // Remove previous selection
        elements.languageOptions.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to current option
        selectedOption.classList.add('selected');
        
        // Update trigger display
        elements.languageSelectValue.innerHTML = selectedOption.innerHTML;
    }
    
    // Load accents and filter voices
    loadAccents(value);
}

/**
 * Setup custom accent select functionality
 */
function setupCustomAccentSelect() {
    // Toggle dropdown
    elements.accentSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccentDropdown();
    });
    
    // Handle option selection
    elements.accentOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-select-option');
        if (option) {
            const value = option.dataset.value;
            selectAccent(value);
            closeAccentDropdown();
        }
    });
    
    // Search functionality
    elements.accentSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterAccentOptions(searchTerm);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.accentSelect.contains(e.target)) {
            closeAccentDropdown();
        }
    });
    
    // Handle keyboard navigation
    elements.accentSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAccentDropdown();
        }
    });
}

/**
 * Toggle accent dropdown visibility
 */
function toggleAccentDropdown() {
    const isOpen = elements.accentSelectDropdown.classList.contains('show');
    if (isOpen) {
        closeAccentDropdown();
    } else {
        openAccentDropdown();
    }
}

/**
 * Open accent dropdown
 */
function openAccentDropdown() {
    elements.accentSelectDropdown.classList.add('show');
    elements.accentSelectTrigger.classList.add('active');
    elements.accentSearch.focus();
    elements.accentSearch.value = '';
    filterAccentOptions('');
}

/**
 * Close accent dropdown
 */
function closeAccentDropdown() {
    elements.accentSelectDropdown.classList.remove('show');
    elements.accentSelectTrigger.classList.remove('active');
}

/**
 * Filter accent options based on search term
 */
function filterAccentOptions(searchTerm) {
    const options = elements.accentOptions.querySelectorAll('.custom-select-option');
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        const value = option.dataset.value.toLowerCase();
        const matches = text.includes(searchTerm) || value.includes(searchTerm);
        option.classList.toggle('hidden', !matches);
    });
}

/**
 * Select an accent option
 */
function selectAccent(value) {
    currentAccent = value;
    
    // Update UI
    const selectedOption = elements.accentOptions.querySelector(`[data-value="${value}"]`);
    if (selectedOption) {
        // Remove previous selection
        elements.accentOptions.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection to current option
        selectedOption.classList.add('selected');
        
        // Update trigger display
        elements.accentSelectValue.innerHTML = selectedOption.innerHTML;
    }
    
    // Filter voices
    filterVoices();
}



/**
 * Load accents for the selected language
 * @param {string} language - Selected language code
 */
function loadAccents(language) {
    try {
        // Clear accent options
        elements.accentOptions.innerHTML = '';
        
        // Add "All accents" option
        const allOption = document.createElement('div');
        allOption.className = 'custom-select-option';
        allOption.dataset.value = 'all';
        allOption.innerHTML = `<span class="fi fi-globe"></span> Всі акценти`;
        elements.accentOptions.appendChild(allOption);
        
        // Update accent label
        const accentLabel = document.querySelector('label[for="accentSelect"]');
        
        if (language !== 'all') {
            // Get unique accents for this language
            const accents = [...new Set(allVoices
                .filter(voice => (voice.Locale || '').startsWith(`${language}-`))
                .map(voice => {
                    const locale = voice.Locale || '';
                    return locale.split('-')[1];
                })
            )].filter(accent => accent).sort();
            
            // Update label with accent count
            if (accentLabel) {
                accentLabel.textContent = `Акцент: (${accents.length})`;
            }
            
            // Add accent options
            accents.forEach(accent => {
                const option = document.createElement('div');
                option.className = 'custom-select-option';
                option.dataset.value = accent;
                
                const accentDesc = ACCENT_DESCRIPTIONS[accent] || accent;
                const flagCode = ACCENT_FLAGS[accent.toUpperCase()];
                
                if (flagCode) {
                    option.innerHTML = `<span class="fi fi-${flagCode}"></span> ${accent} (${accentDesc})`;
                } else {
                    option.innerHTML = `🌐 ${accent} (${accentDesc})`;
                }
                
                elements.accentOptions.appendChild(option);
            });
            
            // Auto-select for single accent or default US for English
            if (accents.length === 1) {
                selectAccent(accents[0]);
            } else if (language === 'en' && accents.includes('US')) {
                selectAccent('US');
            } else {
                selectAccent('all');
            }
        } else {
            // When all languages selected, show total accent count
            const allAccents = [...new Set(allVoices
                .map(voice => {
                    const locale = voice.Locale || '';
                    const parts = locale.split('-');
                    return parts.length > 1 ? parts[1] : null;
                })
            )].filter(accent => accent).length;
            
            if (accentLabel) {
                accentLabel.textContent = `Акцент: (${allAccents})`;
            }
            
            selectAccent('all');
        }
        
        // Setup custom select functionality if not already done
        if (!elements.accentSelectTrigger.hasAttribute('data-setup')) {
            setupCustomAccentSelect();
            elements.accentSelectTrigger.setAttribute('data-setup', 'true');
        }
        
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
        const language = currentLanguage;
        const accent = currentAccent;
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
                    <button class="btn btn-outline-secondary btn-sm mt-2" id="resetFiltersInEmptyList" 
                           data-bs-toggle="tooltip" data-bs-placement="top" title="Скинути всі фільтри">
                        <i class="bi bi-arrow-counterclockwise"></i> Скинути фільтри
                    </button>
                </div>
            `;
            
            // Add event listener to reset button in empty list
            const resetBtn = document.getElementById('resetFiltersInEmptyList');
            resetBtn.addEventListener('click', resetFilters);
            
            // Initialize tooltip for reset button
            new bootstrap.Tooltip(resetBtn);
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
            
            // Визначаємо емоджі в залежності від статі голосу
            const genderIcon = voice.Gender === 'Male' 
                ? '<span class="me-2 fs-4">👨‍🦱</span>' 
                : '<span class="me-2 fs-4">👱‍♀️</span>';
            
            item.innerHTML = `
                <div class="d-flex align-items-center w-100">
                    ${genderIcon}
                    <div class="d-flex flex-column justify-content-center">
                        <span class="fw-medium">${displayName}</span>
                        <small class="text-muted">${displayDetails}</small>
                    </div>
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
    // Language select is now handled by setupCustomLanguageSelect()
    
    // Accent select is now handled by setupCustomAccentSelect()
    
    // Gender select - автоматично фільтрувати при зміні
    elements.genderSelect.addEventListener('change', () => {
        filterVoices(); // Автоматично застосовуємо фільтри
    });
    
    // Reset filters button - додаємо тултіп
    elements.resetFiltersBtn.setAttribute('data-bs-toggle', 'tooltip');
    elements.resetFiltersBtn.setAttribute('data-bs-placement', 'top');
    elements.resetFiltersBtn.setAttribute('title', 'Скинути всі фільтри');
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    new bootstrap.Tooltip(elements.resetFiltersBtn);
    
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
        elements.generationProgress.classList.remove('d-none');
        elements.topPageLoader.classList.remove('d-none');
        elements.generateBtn.disabled = true;
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
        const startTime = performance.now();
        
        // Make request to Edge TTS API
        const response = await fetch(EDGE_TTS_SYNTHESIS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51',
                'Accept': 'audio/mp3',
                'Connection-Id': 'speech-connection-' + Date.now(),
                'X-Search-ClientId': '7D8FA3AC47D6493D89F29B3FAE4A8ADE'
            },
            body: ssml
        });
        
        if (!response.ok) {
            throw new Error(`Error generating audio: ${response.status} ${response.statusText}`);
        }
        
        // Get audio blob from response
        const audioBlob = await response.blob();
        
        // Calculate generation time
        const generationTime = ((performance.now() - startTime) / 1000).toFixed(2);
        
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
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            time: new Date().toISOString(),
            size: audioBlob.size,
            generationTime: generationTime,
            parameters: {
                rate: rate,
                volume: volume,
                pitch: pitch
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
        elements.generationProgress.classList.add('d-none');
        elements.topPageLoader.classList.add('d-none');
        elements.generateBtn.disabled = false;
        
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
        
        return audioData;
    } catch (error) {
        console.error('Error generating audio:', error);
        elements.generationProgress.classList.add('d-none');
        elements.topPageLoader.classList.add('d-none');
        elements.generateBtn.disabled = false;
        updateStatus(`Помилка генерації аудіо: ${error.message}`, 'danger', true);
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
    selectLanguage('all');
    selectAccent('all');
    elements.genderSelect.value = 'all';
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