import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase_config';
import './FeedbackScreen.css';

const FeedbackScreen = ({ conversationId, userId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'feedback'), {
        chatId: conversationId || '',
        userId: userId || '',
        rating,
        comment,
        createdAt: serverTimestamp(),
        resolved: false
      });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Feedback could not be saved. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-content">
        <h2>How was your conversation?</h2>
        <p>Please rate your experience and provide any additional comments.</p>
        
        <div className="star-rating">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <FaStar
                key={index}
                className="star"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={40}
                onClick={() => setRating(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
              />
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)"
            rows="4"
          />
          {error && <div className="feedback-error">{error}</div>}
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Exit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackScreen; 