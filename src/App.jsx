import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import AuthScreen from "./AuthScreen";
import { auth, signOutUser } from "./firebase_config";

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser && messages.length === 0) {
        const welcomeMsg = {
          text: "Merhaba! Size nasıl yardımcı olabilirim?",
          sender: "bot",
          timestamp: getCurrentTimestamp(),
        };
        setMessages([welcomeMsg]);
      }
    });

    return () => unsubscribe();
  }, [messages.length]);

  // Yeni mesajlar geldiğinde otomatik kaydırma
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getCurrentTimestamp = () =>
    new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: "user",
      timestamp: getCurrentTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const botReplyText = await sendMessageToServer(input);
    const botMessage = {
      text: botReplyText,
      sender: "bot",
      timestamp: getCurrentTimestamp(),
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  const sendMessageToServer = async (text) => {
    try {
      const response = await axios.post("http://localhost:3000/api/dialogflow", {
        text,
      });
      return response.data.text;
    } catch (error) {
      console.error("Sunucu hatası:", error.message);
      if (error.response) {
        console.error("Yanıt Hatası:", error.response.data);
        return "Üzgünüm, sunucu hatası oluştu.";
      }
      return "Üzgünüm, bir hata oluştu.";
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setMessages([]);
    } catch (error) {
      console.error("Çıkış hatası:", error.message);
    }
  };

  if (!user) return <AuthScreen />;

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>UniChatbot</h1>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
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
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mesajınızı yazın..."
          className="message-input"
        />
        <button onClick={handleSend} className="send-button">
          <div className="send-icon" />
        </button>
      </div>
      
      <div className="bottom-container">
        <button onClick={handleSignOut} className="signout-button">
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

export default App;
