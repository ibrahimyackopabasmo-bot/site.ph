const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Telegram Bot Configuration - Use environment variable for security
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7706159005:AAE1HzeUEcbVlKb0kiK_rm4LiuhS-4zIG6k';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5000 * 1024 * 1024 // 5000MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('يجب أن يكون الملف بصيغة PDF فقط'));
        }
    }
});

// Create uploads directory if it doesn't exist
// Use try-catch to handle permission issues on Render
try {
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
    }
} catch (error) {
    console.warn('Warning: Could not create uploads directory:', error.message);
    console.warn('File uploads may not work properly.');
}

// Middleware
app.use(cors());
app.use(express.json());

// API routes should come before static file serving
// (API routes are defined below)

// Paper type names in Arabic with prices
const paperTypes = {
    'normal': 'الورق العادي (3,000 دينار للمتر)',
    'colored': 'الورق الملون (5,000 دينار للمتر)',
    'printed': 'الورق الصدفي (13,000 دينار للمتر)',
    'a4': 'ورق A4 (100 دينار للورقة)'
};

// Function to get chat ID (you need to send a message to your bot first to get the chat ID)
// For now, we'll try to send to the bot and handle errors
async function sendTelegramMessage(chatId, message) {
    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Telegram API Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Function to send PDF file to Telegram
async function sendTelegramDocument(chatId, filePath, fileName) {
    try {
        // Check if file exists before trying to send
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found on server' };
        }

        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('document', fs.createReadStream(filePath), {
            filename: fileName,
            contentType: 'application/pdf'
        });

        const response = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, form, {
            headers: form.getHeaders()
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Telegram Document API Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// API endpoint to send request to Telegram
app.post('/api/send-telegram', upload.single('pdfFile'), async (req, res) => {
    try {
        const { customerName } = req.body;

        // Validate required fields
        if (!customerName) {
            // Clean up uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'يرجى إدخال الاسم الكامل' });
        }

        // Validate PDF file
        if (!req.file) {
            return res.status(400).json({ error: 'يرجى رفع ملف PDF' });
        }

        // Format simple message
        const message = `
<b>طلب طباعة جديد من Phonix Printer</b>

<b>الاسم:</b> ${customerName}

<i>تم إرسال الطلب من الموقع الإلكتروني</i>
        `.trim();

        // Note: You need to get your chat ID first
        // You can get it by:
        // 1. Starting a conversation with your bot on Telegram
        // 2. Visiting: https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates
        // 3. Look for "chat":{"id": YOUR_CHAT_ID}
        
        // For now, we'll try to get updates to find the chat ID
        // In production, you should store the chat ID in an environment variable
        let chatId = null;
        
        try {
            const updatesResponse = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
            const updates = updatesResponse.data.result;
            if (updates && updates.length > 0) {
                // Get the most recent chat ID
                chatId = updates[updates.length - 1].message?.chat?.id;
            }
        } catch (error) {
            console.error('Error getting updates:', error.message);
        }

        if (!chatId) {
            // If no chat ID found, return instructions
            return res.status(200).json({ 
                success: true,
                message: 'تم حفظ الطلب. يرجى إرسال رسالة إلى البوت على تيليجرام أولاً للحصول على معرف المحادثة.',
                instructions: 'يرجى إرسال أي رسالة إلى البوت على تيليجرام، ثم إعادة المحاولة.'
            });
        }

        // Send message to Telegram
        const messageResult = await sendTelegramMessage(chatId, message);

        if (!messageResult.success) {
            // Clean up uploaded file if message sending fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ error: 'فشل إرسال الرسالة إلى تيليجرام', details: messageResult.error });
        }

        // Send PDF file to Telegram
        const fileName = req.file.originalname || `طلب_طباعة_${customerName}_${Date.now()}.pdf`;
        const documentResult = await sendTelegramDocument(chatId, req.file.path, fileName);

        // Clean up uploaded file after sending
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (documentResult.success) {
            res.json({ success: true, message: 'تم إرسال الطلب وملف PDF بنجاح إلى تيليجرام!' });
        } else {
            res.json({ 
                success: true, 
                message: 'تم إرسال الطلب بنجاح، لكن فشل إرسال ملف PDF. يرجى المحاولة مرة أخرى.',
                warning: documentResult.error 
            });
        }
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Server Error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم', details: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Google Sheets proxy endpoint to avoid CORS issues
app.get('/api/google-sheets', async (req, res) => {
    try {
        const SHEET_ID = '1hfYLHn6peQLywoNpzVUbgrhI5w-y1xuckuGcbt2a0Ew';
        // Try multiple URL formats to ensure compatibility
        const SHEET_URLS = [
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`,
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`,
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
        ];
        
        let data = null;
        let lastError = null;
        
        // Try the first URL (JSON format)
        try {
            const response = await axios.get(SHEET_URLS[0], {
                headers: {
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            });
            
            // Parse the response (Google Sheets returns text that starts with "google.visualization.Query.setResponse(")
            let responseData = response.data;
            if (typeof responseData === 'string') {
                // Handle the response format - remove the function wrapper
                const jsonMatch = responseData.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
                if (jsonMatch && jsonMatch[1]) {
                    data = JSON.parse(jsonMatch[1]);
                } else {
                    // Try alternative parsing methods
                    const cleaned = responseData.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
                    if (cleaned) {
                        data = JSON.parse(cleaned);
                    } else {
                        // Last resort: extract JSON from the string
                        const jsonText = responseData.replace(/^.*?\(/, '').replace(/\);?\s*$/, '');
                        data = JSON.parse(jsonText);
                    }
                }
            } else {
                data = responseData;
            }
            
            // Validate the response
            if (!data || !data.table) {
                throw new Error('Invalid response format from Google Sheets');
            }
        } catch (error) {
            lastError = error;
            console.error('Error with primary URL, trying alternatives...', error.message);
            // If JSON format fails, we could try CSV format, but for now just throw
            throw new Error(`Failed to fetch sheet data: ${error.message}. Make sure the sheet is published to the web.`);
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching Google Sheets:', error.message);
        console.error('Error details:', error.response?.data || error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch Google Sheets data', 
            details: error.message,
            hint: 'Make sure the sheet is published to the web (File → Share → Publish to web)'
        });
    }
});

// Helper function to send HTML files with error handling
function sendHTMLFile(res, filename) {
    const filePath = path.join(__dirname, filename);
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>خطأ 404</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1>404 - الصفحة غير موجودة</h1>
                <p>الملف المطلوب غير موجود: ${filename}</p>
                <p><a href="/">العودة للصفحة الرئيسية</a></p>
            </body>
            </html>
        `);
    }
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error sending file ${filename}:`, err);
            res.status(500).send(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>خطأ في الخادم</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #d32f2f; }
                    </style>
                </head>
                <body>
                    <h1>500 - خطأ في الخادم</h1>
                    <p>حدث خطأ أثناء تحميل الصفحة</p>
                    <p><a href="/">العودة للصفحة الرئيسية</a></p>
                </body>
                </html>
            `);
        }
    });
}

// Serve HTML files - Root route with fallback
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        sendHTMLFile(res, 'index.html');
    } else {
        // Fallback if index.html doesn't exist
        console.error('index.html not found at:', indexPath);
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>Phonix Printer</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #1976d2; }
                    p { color: #666; line-height: 1.6; }
                    .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>مرحباً بكم في Phonix Printer</h1>
                    <p>الموقع قيد التشغيل!</p>
                    <div class="error">
                        <strong>ملاحظة:</strong> ملف index.html غير موجود في: ${indexPath}
                    </div>
                    <p>الملفات الموجودة في الدليل:</p>
                    <pre>${fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join('\\n') : 'Cannot read directory'}</pre>
                    <p><a href="/test">اختبار الخادم</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

app.get('/index.html', (req, res) => {
    sendHTMLFile(res, 'index.html');
});

app.get('/mywork', (req, res) => {
    sendHTMLFile(res, 'mywork.html');
});

app.get('/mywork.html', (req, res) => {
    sendHTMLFile(res, 'mywork.html');
});

app.get('/prices', (req, res) => {
    sendHTMLFile(res, 'prices.html');
});

app.get('/prices.html', (req, res) => {
    sendHTMLFile(res, 'prices.html');
});

app.get('/contact', (req, res) => {
    sendHTMLFile(res, 'contact.html');
});

app.get('/contact.html', (req, res) => {
    sendHTMLFile(res, 'contact.html');
});

app.get('/request', (req, res) => {
    sendHTMLFile(res, 'request.html');
});

app.get('/request.html', (req, res) => {
    sendHTMLFile(res, 'request.html');
});

app.get('/discussion', (req, res) => {
    sendHTMLFile(res, 'discussion.html');
});

app.get('/discussion.html', (req, res) => {
    sendHTMLFile(res, 'discussion.html');
});

app.get('/errors', (req, res) => {
    sendHTMLFile(res, 'errors.html');
});

app.get('/errors.html', (req, res) => {
    sendHTMLFile(res, 'errors.html');
});

// Add a test route to verify server is running (before static files)
app.get('/test', (req, res) => {
    try {
        const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
        res.json({ 
            status: 'ok', 
            message: 'Server is running!',
            timestamp: new Date().toISOString(),
            directory: __dirname,
            port: PORT,
            host: HOST,
            htmlFiles: htmlFiles,
            indexExists: fs.existsSync(path.join(__dirname, 'index.html'))
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error reading directory',
            error: error.message
        });
    }
});

// Serve static files (CSS, JS, images, videos, etc.) - after all route handlers
// Route handlers (app.get) are matched before app.use middleware, so HTML routes will be handled first
app.use(express.static(path.join(__dirname)));

// 404 handler - must be last
app.use((req, res) => {
    const errorPath = path.join(__dirname, 'errors.html');
    if (fs.existsSync(errorPath)) {
        res.status(404).sendFile(errorPath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>404 - الصفحة غير موجودة</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #d32f2f; font-size: 48px; margin: 0; }
                    h2 { color: #333; margin: 20px 0; }
                    p { color: #666; line-height: 1.6; }
                    a { color: #1976d2; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404</h1>
                    <h2>الصفحة غير موجودة</h2>
                    <p>عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
                    <p>Requested path: ${req.path}</p>
                    <p><a href="/">العودة للصفحة الرئيسية</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

// Start server with error handling
try {
    app.listen(PORT, HOST, () => {
        console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📁 Working directory: ${__dirname}`);
        console.log(`📁 Uploads directory: ${fs.existsSync('uploads') ? 'OK' : 'NOT FOUND'}`);
        console.log(`📄 HTML files available: ${fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).join(', ')}`);
        console.log(`🤖 Telegram Bot: ${TELEGRAM_BOT_TOKEN ? 'Configured' : 'NOT CONFIGURED'}`);
        console.log(`💡 Test endpoint: http://${HOST}:${PORT}/test`);
        console.log(`💡 Make sure to send a message to your Telegram bot first to get the chat ID!`);
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}


