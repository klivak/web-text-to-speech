/**
 * Edge TTS Web Server
 * Proxy server for Microsoft Edge TTS API
 */

const express = require('express');
const https = require('https');
const cors = require('cors');
const path = require('path');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 8080;
const isDev = process.env.NODE_ENV !== 'production';

// Microsoft Edge TTS API endpoints
const EDGE_TTS_VOICES_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_TTS_SYNTHESIS_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/ssml+xml' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Set up static file serving - use either src (dev) or dist (prod) directories
if (isDev) {
    app.use(express.static('public'));
    app.use('/js', express.static('src/js'));
    app.use('/css', express.static('src/css'));
    app.use('/img', express.static('src/img'));
    console.log('Running in DEVELOPMENT mode - serving from src directory');
} else {
    app.use(express.static('dist'));
    console.log('Running in PRODUCTION mode - serving from dist directory');
}

// API Routes
app.get('/api/voices', (req, res) => {
    proxyRequest(EDGE_TTS_VOICES_URL, req, res);
});

app.post('/api/synthesize', (req, res) => {
    proxyRequest(EDGE_TTS_SYNTHESIS_URL, req, res);
});

// Catch-all route to serve index.html for any other request (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, isDev ? 'public' : 'dist', 'index.html'));
});

/**
 * Proxy a request to another server
 * @param {string} targetUrl - The URL to proxy to
 * @param {express.Request} req - The incoming request
 * @param {express.Response} res - The server response
 */
function proxyRequest(targetUrl, req, res) {
    // Parse the target URL
    const parsedUrl = url.parse(targetUrl);
    
    // Prepare options for the proxy request
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            // Copy relevant headers from the original request
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.51',
            'Accept': '*/*',
            'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'Referer': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold/reader.html',
            'Connection': 'keep-alive'
        }
    };
    
    // If this is a synthesis request, add the output format header
    if (targetUrl === EDGE_TTS_SYNTHESIS_URL) {
        options.headers['X-Microsoft-OutputFormat'] = 'audio-16khz-128kbitrate-mono-mp3';
        options.headers['Content-Type'] = 'application/ssml+xml';
        
        // Add required headers for Edge TTS
        options.headers['Connection-Id'] = 'speech-connection-' + Date.now();
        options.headers['X-Search-ClientId'] = '7D8FA3AC47D6493D89F29B3FAE4A8ADE';
        options.headers['Accept'] = 'audio/mp3';
        
        // Additional headers based on Edge browser
        options.path = options.path + '?&TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
        options.headers['Cache-Control'] = 'no-cache';
        options.headers['Pragma'] = 'no-cache';
    }
    
    console.log('Proxy request to:', targetUrl);
    console.log('Request headers:', options.headers);
    
    // Create the proxy request
    const proxyReq = https.request(options, (proxyRes) => {
        console.log('Response status:', proxyRes.statusCode);
        console.log('Response headers:', proxyRes.headers);
        
        // Handle error responses
        if (proxyRes.statusCode >= 400) {
            let responseBody = '';
            proxyRes.on('data', (chunk) => {
                responseBody += chunk.toString();
            });
            
            proxyRes.on('end', () => {
                console.error(`Error response from Edge TTS API: ${responseBody}`);
                res.status(proxyRes.statusCode).send({
                    error: `Error from Edge TTS API: ${proxyRes.statusCode}`,
                    message: responseBody
                });
            });
            return;
        }
        
        // Copy the status code and headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        // Pipe the response data to the original response
        proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
        console.error(`Proxy request error: ${error.message}`);
        res.status(500).json({ error: 'Proxy request failed', message: error.message });
    });
    
    // If the original request has a body, forward it
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const body = req.body;
        
        // If we have raw body as text (SSML)
        if (typeof body === 'string') {
            console.log('Request body:', body);
            
            // Validate SSML before sending
            if (req.headers['content-type'] === 'application/ssml+xml') {
                if (!body.includes('<speak') || !body.includes('</speak>')) {
                    console.error('Invalid SSML content');
                    return res.status(400).json({ error: 'Invalid SSML content' });
                }
            }
            
            proxyReq.write(body);
        } 
        // If body is an object
        else if (body && typeof body === 'object') {
            const stringBody = JSON.stringify(body);
            console.log('Request body:', stringBody);
            proxyReq.write(stringBody);
        }
    }
    
    // End the request
    proxyReq.end();
}

// Start the server
app.listen(PORT, () => {
    console.log(`Web Text-to-Speech server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
}); 