const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow');
const app = express();
app.use(express.json());

// CORS için middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Dialogflow istemci ayarları
let sessionClient;
try {
  sessionClient = new SessionsClient({
    keyFilename: './dialogflow-key.json',
  });
  console.log('Dialogflow istemcisi başarıyla oluşturuldu.');
} catch (error) {
  console.error('Dialogflow istemci hatası:', error.message);
  process.exit(1); // Hata olursa sunucuyu durdur
}

// Basit bir test endpoint'i
app.get('/test', (req, res) => {
  res.send('Sunucu çalışıyor!');
});

// Dialogflow ile iletişim kurma endpoint'i
app.post('/api/dialogflow', async (req, res) => {
  console.log('İstek alındı:', req.body);
  const { text } = req.body;
  const sessionId = Math.random().toString(36).substring(7);
  const sessionPath = sessionClient.projectAgentSessionPath(
    'school-chatbot-459220',
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: 'tr',
      },
    },
  };

  try {
    const [response] = await sessionClient.detectIntent(request);
    console.log('Dialogflow Yanıt:', response.queryResult.fulfillmentText);
    const result = response.queryResult;
    res.json({ text: result.fulfillmentText || 'Üzgünüm, bir yanıt alamadım.' });
  } catch (error) {
    console.error('Dialogflow hatası:', error.message);
    res.status(500).json({ text: 'Üzgünüm, bir hata oluştu.' });
  }
});

// Sunucuyu başlat
const server = app.listen(3000, () => {
  console.log('Sunucu 3000 portunda çalışıyor');
});

// Hata yakalama
server.on('error', (error) => {
  console.error('Sunucu başlatma hatası:', error.message);
});