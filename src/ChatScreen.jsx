import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase_config";
import FeedbackScreen from "./FeedbackScreen";

const ChatScreen = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationEnded, setConversationEnded] = useState(false);

  const chatId = `chatbot_${currentUser.uid}`;
  const messagesRef = collection(db, "chats", chatId, "messages");
  const conversationsRef = collection(db, "conversations");

  // Conversation oluştur veya var olanı al
  useEffect(() => {
    const createOrGetConversation = async () => {
      const activeConversationQuery = query(
        collection(db, "conversations"),
        orderBy("endTime", "desc"),
        orderBy("startTime", "desc")
      );

      const unsubscribe = onSnapshot(activeConversationQuery, async (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const activeConversation = conversations.find(conv => 
          conv.userId === currentUser.uid && !conv.endTime
        );

        if (!activeConversation) {
          const newConversation = await addDoc(conversationsRef, {
            userId: currentUser.uid,
            startTime: serverTimestamp(),
            endTime: null,
            messageCount: 0,
            categories: []
          });
          setConversationId(newConversation.id);
        } else {
          setConversationId(activeConversation.id);
        }
      });

      return unsubscribe;
    };

    createOrGetConversation();
  }, [currentUser.uid]);

  // Mesajları dinle ve ilk mesajı ekle
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgList);

      if (msgList.length === 0) {
        await addDoc(messagesRef, {
          text: "Merhaba! Size nasıl yardımcı olabilirim?",
          sender: "bot",
          timestamp: serverTimestamp(),
        });
      }

      if (conversationId) {
        await updateDoc(doc(db, "conversations", conversationId), {
          messageCount: msgList.length,
        });
      }
    });

    return () => unsubscribe();
  }, [chatId, conversationId]);

  // 5 dakika inaktivite kontrolü
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageTime = lastMessage.timestamp?.toDate();

      if (lastMessageTime) {
        const timeSinceLastMessage = Date.now() - lastMessageTime.getTime();
        if (timeSinceLastMessage > 5 * 60 * 1000 && !conversationEnded) {
          endConversation();
        }
      }
    }
  }, [messages]);

  const endConversation = async () => {
    if (conversationId) {
      await updateDoc(doc(db, "conversations", conversationId), {
        endTime: serverTimestamp(),
      });
      setConversationEnded(true);
      setShowFeedback(true);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setInput("");

    await addDoc(messagesRef, {
      text: trimmed,
      sender: currentUser.uid,
      timestamp: serverTimestamp(),
    });

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

      {showFeedback && (
        <FeedbackScreen
          conversationId={conversationId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default ChatScreen;
