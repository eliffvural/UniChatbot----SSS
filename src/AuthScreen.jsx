import { useState } from "react";
import { signIn, signUp } from "./firebase_config";

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Kayıt işlemi
        await signUp(email, password);
        setSuccess("Kayıt başarılı! Giriş yapabilirsiniz.");
        setTimeout(() => {
          setIsLoading(true);
          setTimeout(() => {
            setIsSignUp(false);
            setSuccess("");
            setIsLoading(false);
          }, 1000);
        }, 1500);
      } else {
        // Giriş işlemi
        await signIn(email, password);
      }
    } catch (err) {
      console.log("Hata detayı:", err.code, err.message);
      
      // Hata mesajlarını Türkçeleştirme
      if (err.message.includes("auth/email-already-in-use")) {
        setError("Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin.");
        setTimeout(() => {
          setIsLoading(true);
          setTimeout(() => {
            setIsSignUp(false);
            setError("");
            setIsLoading(false);
          }, 1000);
        }, 1500);
      } else if (err.message.includes("auth/invalid-credential") || 
                 err.message.includes("auth/user-not-found") || 
                 err.message.includes("auth/wrong-password")) {
        setError("Kullanıcı bulunamadı. Kayıt olmak ister misiniz?");
        setTimeout(() => {
          setIsLoading(true);
          setTimeout(() => {
            setIsSignUp(true);
            setError("");
            setIsLoading(false);
          }, 1000);
        }, 1500);
      } else if (err.message.includes("auth/weak-password")) {
        setError("Şifre en az 6 karakter olmalıdır.");
        setIsLoading(false);
      } else if (err.message.includes("auth/invalid-email")) {
        setError("Geçersiz e-posta adresi.");
        setIsLoading(false);
      } else {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        setIsLoading(false);
      }
    }
  };

  const handleToggleMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setError("");
      setSuccess("");
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="auth-container">
      <div className={`auth-content ${isLoading ? 'fade-out' : 'fade-in'}`}>
        <h2>{isSignUp ? "Kayıt Ol" : "Giriş Yap"}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              isSignUp ? "Kayıt Ol" : "Giriş Yap"
            )}
          </button>
          
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </form>
        
        <p>
          {isSignUp ? "Hesabınız var mı?" : "Hesabınız yok mu?"}{" "}
          <span
            onClick={!isLoading ? handleToggleMode : undefined}
            style={{ 
              color: "#667eea", 
              cursor: isLoading ? "default" : "pointer", 
              fontWeight: "600",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isSignUp ? "Giriş Yap" : "Kayıt Ol"}
          </span>
        </p>
      </div>
      {isLoading && <div className="loading-overlay" />}
    </div>
  );
};

export default AuthScreen;