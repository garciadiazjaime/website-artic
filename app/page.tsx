"use client";

import Image from "next/image";
import { useState } from "react";
import { quizData } from "./question";

const colors = {
  // Main colors
  primary: '#3b82f6',      // Blue for selected/buttons
  success: '#10b981',      // Green for correct
  error: '#ef4444',        // Red for incorrect
  dark: '#1f2937',         // Dark text
  
  // Backgrounds
  bg: {
    page: '#f9fafb',       // Page background
    card: 'white',         // Card background
    primary: '#eff6ff',    // Primary background (blue tint)
    success: '#f0fdf4',    // Success background (green tint)
    error: '#fef2f2',      // Error background (red tint)
  },
  
  // Text
  text: {
    primary: '#1f2937',    // Primary text
    secondary: '#64748b',  // Secondary text
    light: 'rgba(255, 255, 255, 0.9)', // Light text on dark
  },
  
  // Borders & UI
  border: '#d1d5db',       // Default border
  white: 'white',
};

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  const handleAnswerSelect = (option: string) => {
    if (!showResult) setSelectedAnswer(option);
  };

  const handleRevealAnswer = () => {
    if (selectedAnswer) {
      setShowResult(true);
      if (selectedAnswer === currentQuestion.correct_answer) {
        setCorrectAnswers(correctAnswers + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const getOptionStyle = (key: string) => {
    const isSelected = selectedAnswer === key;
    const isCorrect = key === currentQuestion.correct_answer;
    
    let borderColor = colors.border;
    let backgroundColor = colors.white;

    if (showResult && isCorrect) {
      borderColor = colors.success;
      backgroundColor = colors.bg.success;
    } else if (isSelected) {
      if (showResult && !isCorrect) {
        borderColor = colors.error;
        backgroundColor = colors.bg.error;
      } else {
        borderColor = colors.primary;
        backgroundColor = colors.bg.primary;
      }
    }

    return {
      width: '100%',
      textAlign: 'left' as const,
      padding: '0.875rem',
      borderRadius: '0.5rem',
      border: '2px solid',
      borderColor,
      backgroundColor,
      cursor: showResult ? 'default' : 'pointer',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
      fontSize: '0.95rem'
    };
  };

  const getButtonStyle = (bgColor: string, disabled = false) => ({
    padding: '0.875rem 1.5rem',
    backgroundColor: disabled ? colors.border : bgColor,
    color: colors.white,
    borderRadius: '0.5rem',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
    width: '100%'
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: colors.bg.page }}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>        
        <Image 
          src="https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/1686,/0/default.jpg" 
          alt="Art Image" 
          width={1686} 
          height={1619} 
          unoptimized 
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {showFinalResults ? (
          <div style={{ backgroundColor: colors.bg.card, padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: colors.dark }}>
              Quiz Complete!
            </h2>
            
            <div style={{ backgroundColor: colors.bg.primary, borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
              <p style={{ fontSize: '3rem', fontWeight: '700', margin: 0, color: colors.primary }}>
                {correctAnswers}/{quizData.questions.length}
              </p>
              <p style={{ fontSize: '1.125rem', color: colors.text.secondary, marginTop: '0.5rem' }}>
                Correct Answers
              </p>
            </div>

            <div style={{
              backgroundColor: colors.dark,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: colors.text.light,
                margin: 0,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Next Quiz Tomorrow
              </p>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: colors.bg.card, padding: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', lineHeight: '1.5' }}>
              {currentQuestionIndex + 1}. {currentQuestion.question_text}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(key)}
                  style={getOptionStyle(key)}
                  disabled={showResult}
                >
                  {value}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              {!showResult ? (
                <button onClick={handleRevealAnswer} disabled={!selectedAnswer} style={getButtonStyle(colors.primary, !selectedAnswer)}>
                  Reveal Answer
                </button>
              ) : (
                <button 
                  onClick={isLastQuestion ? () => setShowFinalResults(true) : handleNextQuestion}
                  style={getButtonStyle(isLastQuestion ? colors.primary : colors.success)}
                >
                  {isLastQuestion ? 'See Results' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
