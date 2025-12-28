"use client";

import Image from "next/image";
import { useState } from "react";
import { quizData } from "./question";

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];

  const handleAnswerSelect = (option: string) => {
    if (!showResult) {
      setSelectedAnswer(option);
    }
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
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const getOptionStyle = (key: string) => {
    const baseStyle = {
      width: '100%',
      textAlign: 'left' as const,
      padding: '0.875rem',
      borderRadius: '0.5rem',
      border: '2px solid',
      cursor: showResult ? 'default' : 'pointer',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
      fontSize: '0.95rem'
    };

    if (selectedAnswer === key) {
      if (showResult) {
        if (key === currentQuestion.correct_answer) {
          return { ...baseStyle, borderColor: '#10b981', backgroundColor: '#f0fdf4' };
        } else {
          return { ...baseStyle, borderColor: '#ef4444', backgroundColor: '#fef2f2' };
        }
      } else {
        return { ...baseStyle, borderColor: '#3b82f6', backgroundColor: '#eff6ff' };
      }
    } else if (showResult && key === currentQuestion.correct_answer) {
      return { ...baseStyle, borderColor: '#10b981', backgroundColor: '#f0fdf4' };
    } else {
      return { ...baseStyle, borderColor: '#d1d5db', backgroundColor: 'white' };
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>        
        <Image 
          src="https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/1686,/0/default.jpg" 
          alt="Art Image" 
          width={1686} 
          height={1619} 
          unoptimized 
          style={{ 
            width: '100%', 
            height: 'auto',
            display: 'block'
          }}
        />

        {showFinalResults ? (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Quiz Complete!
            </h2>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <p style={{ 
                fontSize: '3rem', 
                fontWeight: '700',
                margin: 0,
                color: '#0284c7'
              }}>
                {correctAnswers}/{quizData.questions.length}
              </p>
              <p style={{ 
                fontSize: '1.125rem',
                color: '#64748b',
                marginTop: '0.5rem'
              }}>
                Correct Answers
              </p>
            </div>

            <div style={{
              backgroundColor: '#000',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                marginBottom: '0.5rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Next Quiz Tomorrow
              </p>
            </div>

          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem'
          }}>
            <h2 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              lineHeight: '1.5'
            }}>
              {currentQuestionIndex+1}. {currentQuestion.question_text}
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
                <button
                  onClick={handleRevealAnswer}
                  disabled={!selectedAnswer}
                  style={{ 
                    padding: '0.875rem 1.5rem', 
                    backgroundColor: selectedAnswer ? '#3b82f6' : '#d1d5db', 
                    color: 'white', 
                    borderRadius: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                    border: 'none',
                    transition: 'background-color 0.2s',
                    width: "100%"
                  }}
                >
                  Reveal Answer
                </button>
              ) : currentQuestionIndex < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  style={{
                    padding: '0.875rem 1.5rem', 
                    backgroundColor: '#10b981', 
                    color: 'white', 
                    borderRadius: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.2s',
                    width: "100%"
                  }}
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={() => setShowFinalResults(true)}
                  style={{ 
                    padding: '0.875rem 1.5rem', 
                    backgroundColor: '#a855f7', 
                    color: 'white', 
                    borderRadius: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.2s',
                    width: '100%'
                  }}
                >
                  See Results
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
