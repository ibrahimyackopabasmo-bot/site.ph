const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '7706159005:AAE1HzeUEcbVlKb0kiK_rm4LiuhS-4zIG6k';
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
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
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

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/mywork', (req, res) => {
    res.sendFile(path.join(__dirname, 'mywork.html'));
});

app.get('/mywork.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'mywork.html'));
});

app.get('/prices', (req, res) => {
    res.sendFile(path.join(__dirname, 'prices.html'));
});

app.get('/prices.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'prices.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/request', (req, res) => {
    res.sendFile(path.join(__dirname, 'request.html'));
});

app.get('/request.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'request.html'));
});

app.get('/discussion', (req, res) => {
    res.sendFile(path.join(__dirname, 'discussion.html'));
});

app.get('/discussion.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'discussion.html'));
});

app.get('/errors', (req, res) => {
    res.sendFile(path.join(__dirname, 'errors.html'));
});

app.get('/errors.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'errors.html'));
});

// Serve static files (CSS, JS, images, videos, etc.) - after all route handlers
// Route handlers (app.get) are matched before app.use middleware, so HTML routes will be handled first
app.use(express.static(path.join(__dirname)));

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'errors.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Make sure to send a message to your Telegram bot first to get the chat ID!`);
});


