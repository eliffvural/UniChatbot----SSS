import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      setMessages([...messages, { text: input, sender: 'user', timestamp }]);
      const botResponse = await sendMessageToServer(input);
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot', timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]);
      setInput('');
    }
  };

  const sendMessageToServer = async (text) => {
    try {
      const response = await axios.post('http://localhost:3000/api/dialogflow', {
        text,
      });
      return response.data.text;
    } catch (error) {
      console.error('Sunucu hatası:', error.message);
      console.error('Hata Kodu:', error.code);
      if (error.response) {
        console.error('Yanıt Hatası:', error.response.data);
        console.error('Durum Kodu:', error.response.status);
      } else if (error.request) {
        console.error('İstek Hatası:', error.request);
        console.error('Hata Detayı:', error.toJSON());
      } else {
        console.error('Genel Hata:', error.message);
      }
      return 'Üzgünüm, bir hata oluştu.';
    }
  };

  useEffect(() => {
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