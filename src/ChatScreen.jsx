import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase_config";

const ChatScreen = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatId = `chatbot_${currentUser.uid}`;
  const messagesRef = collection(db, "chats", chatId, "messages");

  // Mesajları dinle
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgList);

      // Eğer hiç mesaj yoksa, hoş geldin mesajını ekle (yalnızca bir kez)
      if (msgList.length === 0) {
        await addDoc(messagesRef, {
          text: "Merhaba! Size nasıl yardımcı olabilirim?",
          sender: "bot",
          timestamp: serverTimestamp(),
        });
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Mesaj gönderme
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setInput("");

    // Kullanıcı mesajı
    await addDoc(messagesRef, {
      text: trimmed,
      sender: currentUser.uid,
      timestamp: serverTimestamp(),
    });

    // Bot yanıtı
    const botReply = trimmed.toLowerCase().includes("merhaba")
      ? "Merhaba! Size nasıl yardımcı olabilirim?"
      : "Anladım, devam edebilirsiniz.";

    await addDoc(messagesRef, {
      text: botReply,
      sender: "bot",
      timestamp: serverTimestamp(),
    });

    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="app-header">
        <h1>UniChatbot</h1>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === currentUser.uid ? "sent" : "received"}`}
          >
            {msg.text}
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
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
