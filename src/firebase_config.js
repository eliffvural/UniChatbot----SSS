import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, doc, getDocs, getFirestore, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD91tW8ckbCBHBYqztr2h6cXb4CtmgqlPs",
  authDomain: "school-chatbot-459220.firebaseapp.com",
  projectId: "school-chatbot-459220",
  storageBucket: "school-chatbot-459220.firebasestorage.app",
  messagingSenderId: "922936675640",
  appId: "1:922936675640:web:2b68585397258371d445cd",
  measurementId: "G-SC6YDS1RER"
};

// Firebase'i başlat
console.log("Firebase başlatılıyor...");
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
console.log("Firebase başlatıldı");

// Firestore koleksiyonları
export const messagesRef = collection(db, "messages");
export const chatsRef = collection(db, "chats");

// Sohbet geçmişi işlemleri
export const saveChat = async (userId, messages, lastMessage) => {
  console.log("saveChat fonksiyonu çağrıldı");
  console.log("Kaydedilecek veriler:", { userId, messages, lastMessage });
  
  try {
    // Son mesajın içeriğine göre kategori belirleme
    const category = determineCategory(lastMessage);
    
    const chatData = {
      userId,
      messages,
      lastMessage,
      category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(chatsRef, chatData);
    console.log("Sohbet başarıyla kaydedildi, docId:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("saveChat fonksiyonunda hata:", error);
    throw error;
  }
};

export const updateChat = async (chatId, messages, lastMessage) => {
  console.log("updateChat fonksiyonu çağrıldı");
  console.log("Güncellenecek veriler:", { chatId, messages, lastMessage });
  
  try {
    const category = determineCategory(lastMessage);
    const chatRef = doc(chatsRef, chatId);
    await updateDoc(chatRef, {
      messages,
      lastMessage,
      category,
      updatedAt: serverTimestamp()
    });
    console.log("Sohbet başarıyla güncellendi");
  } catch (error) {
    console.error("updateChat fonksiyonunda hata:", error);
    throw error;
  }
};

// Kategori belirleme yardımcı fonksiyonu
const determineCategory = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('ders') || lowerMessage.includes('ödev') || 
      lowerMessage.includes('sınav') || lowerMessage.includes('akademik')) {
    return 'academic';
  } else if (lowerMessage.includes('kulüp') || lowerMessage.includes('etkinlik') || 
             lowerMessage.includes('sosyal') || lowerMessage.includes('arkadaş')) {
    return 'social';
  } else if (lowerMessage.includes('teknik') || lowerMessage.includes('sistem') || 
             lowerMessage.includes('internet') || lowerMessage.includes('bilgisayar')) {
    return 'technical';
  }
  
  return 'general';
};

export const getUserChats = async (userId) => {
  console.log("getUserChats fonksiyonu çağrıldı, userId:", userId);
  
  try {
    const q = query(
      chatsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    console.log("Sorgu oluşturuldu");
    const querySnapshot = await getDocs(q);
    console.log("Sorgu sonuçları alındı, belge sayısı:", querySnapshot.size);
    
    const chats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Timestamp'i Date nesnesine çevir
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      
      return {
        id: doc.id,
        ...data,
        createdAt
      };
    });
    
    console.log("İşlenmiş sohbet verileri:", chats);
    return chats;
  } catch (error) {
    console.error("getUserChats fonksiyonunda hata:", error);
    throw error;
  }
};

// Kullanıcı işlemleri
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sohbet mesajları işlemleri
export const saveMessage = async (userId, message) => {
  try {
    return await addDoc(messagesRef, {
      userId,
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Mesaj kaydedilirken hata:", error);
    throw error;
  }
};

export const getUserMessages = async (userId) => {
  try {
    const q = query(
      messagesRef,
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp || new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    }));
  } catch (error) {
    console.error("Mesajlar getirilirken hata:", error);
    throw error;
  }
};
