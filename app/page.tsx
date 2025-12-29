"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Question {
  difficulty: string;
  question_number: number;
  question_text: string;
  options: {
    [key: string]: string;
  };
  correct_answer: string;
}

interface QuizData {
  quiz_title: string;
  image: string;
  questions: Question[];
}

const colors = {
  // Main colors
  primary: "#3b82f6", // Blue for selected/buttons
  success: "#10b981", // Green for correct
  error: "#ef4444", // Red for incorrect
  dark: "#1f2937", // Dark text

  // Backgrounds
  bg: {
    page: "#f9fafb", // Page background
    card: "white", // Card background
    primary: "#eff6ff", // Primary background (blue tint)
    success: "#f0fdf4", // Success background (green tint)
    error: "#fef2f2", // Error background (red tint)
  },

  // Text
  text: {
    primary: "#1f2937", // Primary text
    secondary: "#64748b", // Secondary text
    light: "rgba(255, 255, 255, 0.9)", // Light text on dark
  },

  // Borders & UI
  border: "#d1d5db", // Default border
  white: "white",
};

const IMAGE_WIDTH = 843;
const IMAGE_HEIGHT = 809;

const getButtonStyle = (bgColor: string, disabled = false) => ({
  padding: "0.875rem 1.5rem",
  backgroundColor: disabled ? colors.border : bgColor,
  color: colors.white,
  borderRadius: "0.5rem",
  fontWeight: "600",
  fontSize: "1rem",
  cursor: disabled ? "not-allowed" : "pointer",
  border: "none",
  transition: "background-color 0.2s",
  width: "100%",
});

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [streak, setStreak] = useState(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("quizStreak");
      if (data) {
        const parsed = JSON.parse(data) as { streak: number; lastDate: number };
        return parsed.streak;
      }
    }
    return 0;
  });

  useEffect(() => {
    fetch("/api/quiz")
      .then((res) => res.json())
      .then((data) => setQuizData(data))
      .catch((err) => console.error("Failed to load questions:", err));
  }, []);

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isLastQuestion = quizData
    ? currentQuestionIndex === quizData.questions.length - 1
    : false;

  const handleAnswerSelect = (option: string) => {
    if (!showResult) setSelectedAnswer(option);
  };

  const handleRevealAnswer = () => {
    if (selectedAnswer && currentQuestion) {
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

  const handleShowFinalResults = () => {
    const date = new Date();
    const today =
      (date.getFullYear() % 100) * 10000 +
      (date.getMonth() + 1) * 100 +
      date.getDate();

    const data = localStorage.getItem("quizStreak");
    let newStreak = 1;

    if (data) {
      const parsed = JSON.parse(data) as { streak: number; lastDate: number };

      if (parsed.lastDate === today) {
        // Already completed today
        newStreak = parsed.streak;
      } else {
        // Check if lastDate was yesterday
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayNum =
          (yesterday.getFullYear() % 100) * 10000 +
          (yesterday.getMonth() + 1) * 100 +
          yesterday.getDate();

        if (parsed.lastDate === yesterdayNum) {
          // Continue streak
          newStreak = parsed.streak + 1;
        } else {
          // Streak broken, reset to 1
          newStreak = 1;
        }
      }
    }

    localStorage.setItem(
      "quizStreak",
      JSON.stringify({ streak: newStreak, lastDate: today })
    );
    setStreak(newStreak);
    setShowFinalResults(true);
  };

  const getOptionStyle = (key: string) => {
    if (!currentQuestion) return {};

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
      width: "100%",
      textAlign: "left" as const,
      padding: "0.875rem",
      borderRadius: "0.5rem",
      border: "2px solid",
      borderColor,
      backgroundColor,
      cursor: showResult ? "default" : "pointer",
      marginBottom: "0.5rem",
      transition: "all 0.2s",
      fontSize: "0.95rem",
    };
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg.page,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        {!quizData ? (
          <div
            style={{
              width: "100%",
              aspectRatio: `${IMAGE_WIDTH}/${IMAGE_HEIGHT}`,
              backgroundColor: colors.border,
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              display: "block",
            }}
          />
        ) : (
          <Image
            src={quizData.image}
            alt="Art Image"
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            unoptimized
            loading="eager"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        )}

        {!quizData ? (
          <div style={{ backgroundColor: colors.bg.card, padding: "1rem" }}>
            {/* Question skeleton */}
            <div
              style={{
                height: "3rem",
                backgroundColor: colors.border,
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />

            {/* Options skeleton */}
            <div style={{ marginBottom: "1rem" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "2.75rem",
                    backgroundColor: colors.border,
                    borderRadius: "0.5rem",
                    marginBottom: "0.5rem",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              ))}
            </div>

            {/* Button skeleton */}
            <div
              style={{
                height: "3rem",
                backgroundColor: colors.border,
                borderRadius: "0.5rem",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </div>
        ) : showFinalResults ? (
          <div
            style={{
              backgroundColor: colors.bg.card,
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                backgroundColor: colors.bg.primary,
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1rem",
                border: `2px solid ${colors.primary}`,
              }}
            >
              <p
                style={{
                  fontSize: "3rem",
                  fontWeight: "700",
                  margin: 0,
                  color: colors.primary,
                }}
              >
                {correctAnswers}/{quizData.questions.length}
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  color: colors.text.secondary,
                  marginTop: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Correct Answers
              </p>
            </div>

            <div
              style={{
                backgroundColor: colors.bg.page,
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1rem",
                border: `2px solid ${colors.border}`,
              }}
            >
              <p
                style={{
                  fontSize: "3rem",
                  fontWeight: "700",
                  margin: 0,
                  color: colors.dark,
                }}
              >
                {streak}
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  color: colors.text.secondary,
                  marginTop: "0.5rem",
                  fontWeight: "500",
                }}
              >
                {streak === 1 ? "Day Streak" : "Day Streak"}
              </p>
            </div>

            <div
              style={{
                backgroundColor: colors.bg.page,
                borderRadius: "1rem",
                padding: "1rem",
                border: `2px solid ${colors.border}`,
              }}
            >
              <p
                style={{
                  fontSize: "1rem",
                  color: colors.text.secondary,
                  margin: 0,
                  fontWeight: "500",
                }}
              >
                Next Quiz Tomorrow
              </p>
            </div>
          </div>
        ) : currentQuestion ? (
          <div style={{ backgroundColor: colors.bg.card, padding: "1rem" }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "1rem",
                lineHeight: "1.5",
              }}
            >
              {currentQuestion.question_text}
            </h2>

            <div style={{ marginBottom: "1rem" }}>
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

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexDirection: "column",
              }}
            >
              {!showResult ? (
                <button
                  onClick={handleRevealAnswer}
                  disabled={!selectedAnswer}
                  style={getButtonStyle(colors.primary, !selectedAnswer)}
                >
                  Reveal Answer
                </button>
              ) : (
                <button
                  onClick={
                    isLastQuestion ? handleShowFinalResults : handleNextQuestion
                  }
                  style={getButtonStyle(
                    isLastQuestion ? colors.primary : colors.success
                  )}
                >
                  {isLastQuestion ? "See Results" : "Next Question"}
                </button>
              )}
            </div>

            {currentQuestionIndex === 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                  paddingTop: "0.75rem",
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: colors.text.secondary,
                  }}
                >
                  Today&nbsp;s Quiz
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: colors.text.secondary,
                  }}
                >
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {quizData && !showFinalResults && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "4px",
            backgroundColor: colors.border,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: `${
                ((currentQuestionIndex + 1) / quizData.questions.length) * 100
              }%`,
              height: "100%",
              backgroundColor: colors.primary,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </main>
  );
}
