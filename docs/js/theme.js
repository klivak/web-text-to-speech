/**
 * Theme handling script for TTS Generator
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get theme DOM elements
    const themeLight = document.getElementById('themeLight');
    const themeDark = document.getElementById('themeDark');
    const themeSystem = document.getElementById('themeSystem');
    const html = document.documentElement;
    
    // Load saved theme or use system setting
    const savedTheme = localStorage.getItem('tts-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
        localStorage.setItem('tts-theme', 'system'); // Save that we're using system theme
    }
    
    // Set event listeners for theme buttons
    themeLight.addEventListener('click', () => {
        setTheme('light');
        localStorage.setItem('tts-theme', 'light');
    });
    
    themeDark.addEventListener('click', () => {
        setTheme('dark');
        localStorage.setItem('tts-theme', 'dark');
    });
    
    themeSystem.addEventListener('click', () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
        localStorage.setItem('tts-theme', 'system');
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('tts-theme') === 'system') {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    /**
     * Sets the theme for the application
     * @param {string} theme - 'light' or 'dark'
     */
    function setTheme(theme) {
        html.setAttribute('data-bs-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#121212' : '#4361EE');
        }
        
        // Update navbar class
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.remove('navbar-dark', 'navbar-light', 'bg-dark', 'bg-primary');
            if (theme === 'dark') {
                navbar.classList.add('navbar-dark', 'bg-dark');
            } else {
                navbar.classList.add('navbar-dark', 'bg-primary');
            }
        }
    }
}); 