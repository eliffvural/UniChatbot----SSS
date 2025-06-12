import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import AdminPanel from "./AdminPanel";
import "./App.css";
import AuthScreen from "./AuthScreen";
import FeedbackScreen from "./FeedbackScreen";
import { auth, getUserChats, saveChat, signOutUser, updateChat } from "./firebase_config";

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isNewChat, setIsNewChat] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'admin'
  const [conversationId, setConversationId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const chatContainerRef = useRef(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);

      if (currentUser) {
        // Eğer admin ise direkt admin panelini aç
        if (currentUser.email === 'admin@example.com') {
          setCurrentView('admin');
        } else {
          setCurrentView('chat');
          await loadChatHistory(currentUser.uid);
        }
      } else {
        setCurrentView('chat');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadChatHistory = async (userId) => {
    try {
      console.log("loadChatHistory çağrıldı, userId:", userId);
      setIsLoading(true);
      const chats = await getUserChats(userId);
      console.log("Yüklenen sohbet geçmişi:", chats);
      console.log("Sohbet sayısı:", chats.length);
      setChatHistory(chats);
    } catch (error) {
      console.error("Chat history yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const botReplyText = await sendMessageToServer(input);
      const botMessage = {
        text: botReplyText,
        sender: "bot",
        timestamp: getCurrentTimestamp(),
      };

      const updatedMessages = [...newMessages, botMessage].sort((a, b) => {
        const timeA = new Date(a.timestamp);
        const timeB = new Date(b.timestamp);
        return timeA - timeB;
      });
      
      setMessages(updatedMessages);

      if (user) {
        if (isNewChat) {
          const docRef = await saveChat(user.uid, updatedMessages, botMessage.text);
          setCurrentChatId(docRef.id);
          setConversationId(docRef.id);
        } else {
          await updateChat(currentChatId, updatedMessages, botMessage.text);
        }
        await loadChatHistory(user.uid);
      }
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
    }
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
      if (user && user.email !== 'admin@example.com') {
        setShowFeedback(true);
      } else {
        try {
          await signOutUser();
          setUser(null);
          setMessages([]);
          setChatHistory([]);
          setIsNewChat(true);
          setCurrentView('chat');
        } catch (error) {
          console.error("Çıkış hatası:", error.message);
        }
      }
  };

  const handleFeedbackComplete = async () => {
      try {
        await signOutUser();
        setUser(null);
        setMessages([]);
        setChatHistory([]);
        setIsNewChat(true);
        setShowFeedback(false);
        setCurrentView('chat');
      } catch (error) {
        console.error("Çıkış hatası:", error.message);
      }
    };
  
    const handleAdminSignOut = async () => {
      try {
        await signOutUser();
        setUser(null);
        setMessages([]);
        setChatHistory([]);
        setIsNewChat(true);
        setShowFeedback(false);
        setCurrentView('chat'); // İstersen admin panelden çıkınca chat ekranına yönlendirebilirsin
      } catch (error) {
        console.error("Çıkış hatası:", error.message);
      }
    };

  const startNewChat = () => {
    setIsNewChat(true);
    setCurrentChatId(null);
    setMessages([{
      text: "Merhaba! Size nasıl yardımcı olabilirim?",
      sender: "bot",
      timestamp: getCurrentTimestamp(),
    }]);
  };

  const loadChat = async (chat) => {
    try {
      setIsLoadingChat(true);
      console.log("Yüklenen sohbet:", chat);
      setIsNewChat(false);
      setCurrentChatId(chat.id);
      
      if (Array.isArray(chat.messages)) {
        const sortedMessages = [...chat.messages].sort((a, b) => {
          const timeA = new Date(a.timestamp);
          const timeB = new Date(b.timestamp);
          return timeA - timeB;
        });
        
        setMessages(sortedMessages);
        
        // Mesajların render edilmesini bekle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Scroll işlemini yap
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      } else {
        console.error("Sohbet mesajları dizi değil:", chat.messages);
        setMessages([]);
      }
    } catch (error) {
      console.error("Sohbet yüklenirken hata:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  if (!user) return <AuthScreen />;

  if (user && user.email === 'admin@example.com') {
    return <AdminPanel handleAdminSignOut={handleAdminSignOut} />;
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>UniChatbot</h1>
        <div className="nav-buttons">
          {currentView === 'chat' ? (
            <>
              <button
                className={`nav-button ${isNewChat ? 'active' : ''}`}
                onClick={startNewChat}
              >
                Yeni Sohbet
              </button>
              <button
                className={`nav-button ${!isNewChat ? 'active' : ''}`}
                onClick={() => {
                  setIsNewChat(false);
                  loadChatHistory(user.uid);
                }}
              >
                Geçmiş Sohbetler
              </button>
              {user.email === 'admin@example.com' && (
                <button
                  className="nav-button"
                  onClick={() => setCurrentView('admin')}
                >
                  Admin Panel
                </button>
              )}
            </>
          ) : (
            <button
              className="nav-button"
              onClick={() => setCurrentView('chat')}
            >
              Chat'e Dön
            </button>
          )}
        </div>
      </div>

      {currentView === 'chat' ? (
        <>
          <div className="chat-layout">
            <div className="chat-main">
              <div className="chat-container" ref={chatContainerRef}>
                {isLoadingChat ? (
                  <div className="loading-messages">
                    <div className="loading-spinner" />
                    <p>Sohbet yükleniyor...</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="message-text">{msg.text}</div>
                      <div className="message-timestamp">{msg.timestamp}</div>
                    </div>
                  ))
                )}
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
            </div>

            {!isNewChat && (
              <div className="chat-sidebar">
                <div className="chat-list">
                  <h3>Geçmiş Sohbetler</h3>
                  {isLoading ? (
                    <div className="loading-messages">
                      <div className="loading-spinner" />
                      <p>Sohbet geçmişi yükleniyor...</p>
                    </div>
                  ) : chatHistory && chatHistory.length > 0 ? (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`chat-history-item ${currentChatId === chat.id ? 'active' : ''}`}
                        onClick={() => loadChat(chat)}
                      >
                        <div className="chat-history-time">
                          {chat.createdAt instanceof Date ?
                            chat.createdAt.toLocaleString('tr-TR') :
                            new Date(chat.createdAt).toLocaleString('tr-TR')}
                        </div>
                        <div className="chat-history-preview">{chat.lastMessage}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-history">Henüz sohbet geçmişi bulunmuyor.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}

      {currentView === 'chat' && (
        <div className="bottom-container">
          <button onClick={handleSignOut} className="signout-button">
            Çıkış Yap
          </button>
        </div>
      )}

      {/* Feedback ekranı - sadece ikinci versiyonda vardı */}
      {showFeedback && (
        <FeedbackScreen
          conversationId={conversationId}
          userId={user?.uid}
          onClose={handleFeedbackComplete}
        />
      )}
    </div>
  );
}


export default App;
