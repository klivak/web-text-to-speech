/**
 * Build script for Web Text-to-Speech client
 */

const fs = require('fs-extra');
const path = require('path');

console.log('Building Web Text-to-Speech client...');

// Clean dist directory
fs.emptyDirSync(path.join(__dirname, 'dist'));
console.log('✅ Cleaned dist directory');

// Copy public files to dist
fs.copySync(path.join(__dirname, 'public'), path.join(__dirname, 'dist'));
console.log('✅ Copied public files to dist');

// Copy src files to dist with proper structure
fs.copySync(path.join(__dirname, 'src'), path.join(__dirname, 'dist'));
console.log('✅ Copied src files to dist');

// Modify app.js to remove CORS proxy in production build
const appJsPath = path.join(__dirname, 'dist', 'js', 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Change API URLs to use local proxy
appJsContent = appJsContent.replace(
    /const CORS_PROXY = .*?;/,
    '// Production build uses local proxy\nconst CORS_PROXY = \'\';'
);

appJsContent = appJsContent.replace(
    /const EDGE_TTS_API_URL = .*?;/,
    'const EDGE_TTS_API_URL = \'/api/voices\';'
);

appJsContent = appJsContent.replace(
    /const EDGE_TTS_SYNTHESIS_URL = .*?;/,
    'const EDGE_TTS_SYNTHESIS_URL = \'/api/synthesize\';'
);

fs.writeFileSync(appJsPath, appJsContent);
console.log('✅ Modified app.js for production');

// Create GitHub Pages version in docs folder
fs.emptyDirSync(path.join(__dirname, 'docs'));
fs.copySync(path.join(__dirname, 'src'), path.join(__dirname, 'docs'));
fs.copySync(path.join(__dirname, 'public', 'index.html'), path.join(__dirname, 'docs', 'index.html'));

// Modify app.js in docs to use CORS proxy for GitHub Pages
const docsAppJsPath = path.join(__dirname, 'docs', 'js', 'app.js');
let docsAppJsContent = fs.readFileSync(docsAppJsPath, 'utf8');

// Ensure GitHub Pages version uses CORS proxy
docsAppJsContent = docsAppJsContent.replace(
    /const CORS_PROXY = .*?;/,
    'const CORS_PROXY = \'https://corsproxy.io/?\';'
);

docsAppJsContent = docsAppJsContent.replace(
    /const EDGE_TTS_API_URL = .*?;/,
    'const EDGE_TTS_API_URL = CORS_PROXY + encodeURIComponent(\'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4\');'
);

docsAppJsContent = docsAppJsContent.replace(
    /const EDGE_TTS_SYNTHESIS_URL = .*?;/,
    'const EDGE_TTS_SYNTHESIS_URL = CORS_PROXY + encodeURIComponent(\'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud\');'
);

fs.writeFileSync(docsAppJsPath, docsAppJsContent);
console.log('✅ Created GitHub Pages version in docs folder');

console.log('✅ Build completed successfully!'); 