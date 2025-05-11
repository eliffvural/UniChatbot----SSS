import { useEffect, useState } from 'react';
import './App.css';

// Dialogflow bağımlılığını import et
const dialogflow = require('@google-cloud/dialogflow');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(Math.random().toString(36).substring(7)); // Rastgele session ID

  // Dialogflow ile iletişim kurma fonksiyonu
  const sendMessageToDialogflow = async (text) => {
    try {
      const sessionClient = new dialogflow.SessionsClient();
      const sessionPath = sessionClient.projectAgentSessionPath(
        'school-chatbot-459220', // Buraya Dialogflow Proje ID’ni yaz (örneğin, school-chatbot-123456)
        sessionId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: text,
            languageCode: 'tr', // Türkçe için
          },
        },
      };

      const responses = await sessionClient.detectIntent(request);
      const result = responses[0].queryResult;

      return result.fulfillmentText;
    } catch (error) {
      console.error('Dialogflow hatası:', error);
      return 'Üzgünüm, bir hata oluştu.';
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      setMessages([...messages, { text: input, sender: 'user', timestamp }]);
      const botResponse = await sendMessageToDialogflow(input);
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot', timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]);
      setInput('');
    }
  };

  useEffect(() => {
    // Sayfa yüklendiğinde hoş geldin mesajı
    const welcomeMessage = 'Merhaba! Size nasıl yardımcı olabilirim?';
    setMessages([{ text: welcomeMessage, sender: 'bot', timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]);
  }, []);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>UniChatbot</h1>
      </div>
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-text">{msg.text}</div>
            <div className="message-timestamp">{msg.timestamp}</div>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Mesajınızı yazın..."
          className="message-input"
        />
        <button onClick={handleSend} className="send-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="send-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;