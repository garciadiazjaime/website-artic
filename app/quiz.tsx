"use client";

import Image from "next/image";
import { useState } from "react";

import colors from "./colors";

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
  provenance: string[];
}

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

function Results(props: {
  quiz: QuizData;
  correctAnswers: number;
  streak: number;
}) {
  const { quiz, correctAnswers, streak } = props;
  return (
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
          {correctAnswers}/{quiz.questions.length}
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

      {quiz.provenance?.length ? (
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: `2px solid ${colors.border}`,
            textAlign: "left",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: 0,
              marginBottom: "1rem",
            }}
          >
            Artwork Provenance
          </h3>
          <div
            style={{
              backgroundColor: colors.bg.page,
              borderRadius: "0.5rem",
              padding: "1rem",
            }}
          >
            {quiz.provenance.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  color: colors.text.secondary,
                  marginBottom:
                    index < quiz.provenance.length - 1 ? "0.75rem" : 0,
                }}
              >
                <span style={{ marginRight: "0.5rem", flexShrink: 0 }}>•</span>
                <span
                  style={{
                    fontWeight:
                      quiz.provenance.length - 1 === index ? "bold" : "normal",
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Questions(props: {
  currentQuestion: Question | undefined;
  handleAnswerSelect: (option: string) => void;
  selectedAnswer: string | null;
  showResult: boolean;
  handleRevealAnswer: () => void;
  isLastQuestion: boolean;
  handleNextQuestion: () => void;
  handleShowFinalResults: () => void;
}) {
  const {
    currentQuestion,
    handleAnswerSelect,
    selectedAnswer,
    showResult,
    handleRevealAnswer,
    isLastQuestion,
    handleNextQuestion,
    handleShowFinalResults,
  } = props;

  if (!currentQuestion) return null;

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
    <div style={{ backgroundColor: colors.bg.card, padding: ".6rem" }}>
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
            Submit
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
    </div>
  );
}

export default function Quiz({ quiz }: { quiz: QuizData }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);
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

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion = quiz
    ? currentQuestionIndex === quiz.questions.length - 1
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

  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: colors.bg.page,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <Image
          src={quiz.image}
          alt="Art Image"
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          unoptimized
          loading="eager"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            maxHeight: "48vh",
          }}
        />

        {showFinalResults ? (
          <Results
            quiz={quiz}
            correctAnswers={correctAnswers}
            streak={streak}
          />
        ) : (
          <Questions
            currentQuestion={currentQuestion}
            handleAnswerSelect={handleAnswerSelect}
            selectedAnswer={selectedAnswer}
            showResult={showResult}
            handleRevealAnswer={handleRevealAnswer}
            isLastQuestion={isLastQuestion}
            handleNextQuestion={handleNextQuestion}
            handleShowFinalResults={handleShowFinalResults}
          />
        )}
      </div>
    </main>
  );
}
