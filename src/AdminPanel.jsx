import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase_config';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import './AdminPanel.css';

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const AdminPanel = ({ handleAdminSignOut }) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    resolved: 0,
    unresolved: 0,
    mostCommonRating: null,
    feedbackByDay: {},
  });

  useEffect(() => {
    const feedbackQuery = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc')
    );
    const feedbackUnsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
      }));
      setFeedback(feedbackData);

      // Calculate statistics
      const totalRatings = feedbackData.reduce((sum, item) => sum + (item.rating || 0), 0);
      const ratingDistribution = feedbackData.reduce((acc, item) => {
        acc[item.rating] = (acc[item.rating] || 0) + 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      const resolved = feedbackData.filter(fb => fb.resolved).length;
      const unresolved = feedbackData.filter(fb => !fb.resolved).length;
      // Most common rating
      let mostCommonRating = null;
      let maxCount = 0;
      Object.entries(ratingDistribution).forEach(([star, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonRating = star;
        }
      });
      // Feedback by day
      const feedbackByDay = {};
      feedbackData.forEach(item => {
        const day = formatDate(item.createdAt).split(' ')[0];
        if (day) feedbackByDay[day] = (feedbackByDay[day] || 0) + 1;
      });
      setStats({
        totalFeedback: feedbackData.length,
        averageRating: feedbackData.length ? (totalRatings / feedbackData.length).toFixed(1) : 0,
        ratingDistribution,
        resolved,
        unresolved,
        mostCommonRating,
        feedbackByDay,
      });
    });
    return () => feedbackUnsubscribe();
  }, []);

  // Toggle resolved status for a feedback
  const toggleResolved = async (feedbackId, currentResolved) => {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, { resolved: !currentResolved });
    } catch (error) {
      alert('Durum güncellenemedi.');
    }
  };

  return (
    <div className="admin-centered-layout">
      <div className="admin-centered-content">
        <h1 className="admin-title">UniChatbot - Admin Paneli</h1>
        {/* Dashboard grid for stats and charts */}
        <div className="dashboard-grid">
          <div className="dashboard-row">
            <div className="stat-card">
              <h3>Toplam Geri Bildirim</h3>
              <div className="stat-value">{stats.totalFeedback}</div>
            </div>
            <div className="stat-card">
              <h3>Ortalama Puan</h3>
              <div className="stat-value">{stats.averageRating}</div>
            </div>
            <div className="stat-card">
              <h3>En Sık Puan</h3>
              <div className="stat-value">{stats.mostCommonRating ? `${'★'.repeat(stats.mostCommonRating)}` : '-'}</div>
            </div>
            <div className="stat-card">
              <h3>Çözülen / Çözülmeyen</h3>
              <div className="stat-value">{stats.resolved} / {stats.unresolved}</div>
            </div>
          </div>
          <div className="dashboard-row dashboard-charts">
            <div className="dashboard-chart-card">
              <h3 style={{marginBottom: '1rem', color: '#4a3fa5', fontWeight: 700}}>Geri Bildirim Trendi (Günlük)</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {Object.keys(stats.feedbackByDay).length === 0 && <span style={{color: '#888'}}>Veri yok</span>}
                <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                  <div style={{display: 'flex', fontWeight: 600, color: '#333', borderBottom: '1px solid #e2e8f0', marginBottom: 6}}>
                    <span style={{flex: 1}}>Tarih</span>
                    <span style={{width: 40, textAlign: 'right'}}>Adet</span>
                  </div>
                  {Object.entries(stats.feedbackByDay).map(([day, count]) => (
                    <div key={day} style={{display: 'flex', alignItems: 'center', color: '#222'}}>
                      <span style={{flex: 1}}>{day}</span>
                      <span style={{width: 40, textAlign: 'right', fontWeight: 700}}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dashboard-chart-card">
              <h3 style={{marginBottom: '1rem', color: '#4a3fa5', fontWeight: 700}}>Puan Dağılımı</h3>
              <div className="rating-distribution">
                {[5,4,3,2,1].map(star => (
                  <div className="rating-row" key={star}>
                    <span className="stars">{'★'.repeat(star)}{'☆'.repeat(5-star)}</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{width: stats.totalFeedback ? `${(stats.ratingDistribution[star] / stats.totalFeedback) * 100}%` : '0%'}}
                      />
                      <span className="bar-label">{stats.ratingDistribution[star]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Feedback List Section */}
        <div className="feedback-section">
          <h2 className="admin-section-title">Son Geri Bildirimler</h2>
          <div className="feedback-list">
            {feedback.length === 0 && (
              <div style={{color: '#888', textAlign: 'center', padding: '2rem'}}>Henüz geri bildirim yok.</div>
            )}
            {feedback.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className={`feedback-card${item.resolved ? ' resolved' : ''}`}
                style={{display: 'flex', alignItems: 'flex-start', gap: 16, opacity: item.resolved ? 0.7 : 1, background: item.resolved ? '#e8f5e9' : '#fff', borderLeft: item.resolved ? '5px solid #4caf50' : '5px solid #ffd700'}}
              >
                <span
                  className="feedback-resolved-icon"
                  title={item.resolved ? 'Çözüldü' : 'Çözülmedi'}
                  style={{cursor: 'pointer', marginTop: 4, fontSize: 22, color: item.resolved ? '#4caf50' : '#bbb'}}
                  onClick={() => toggleResolved(item.id, item.resolved)}
                >
                  {item.resolved ? <FaCheckCircle /> : <FaRegCircle />}
                </span>
                <div style={{flex: 1}}>
                  <div className="feedback-header" style={{marginBottom: 4}}>
                    <div className="rating">
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </div>
                    <div className="timestamp">
                      {item.createdAt ? formatDate(item.createdAt) : ''}
                    </div>
                  </div>
                  {item.comment && (
                    <p className="comment">{item.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className="admin-footer-bar">
        <button className="signout-button admin-exit-btn" onClick={handleAdminSignOut}>
          Çıkış Yap
        </button>
      </footer>
    </div>
  );
};

export default AdminPanel;
