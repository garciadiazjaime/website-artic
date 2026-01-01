const colors = {
  primary: "#3b82f6",
  dark: "#1f2937",
  bg: {
    page: "#f9fafb",
    card: "white",
  },
  text: {
    primary: "#1f2937",
    secondary: "#64748b",
  },
  border: "#d1d5db",
};

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg.page,
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            backgroundColor: colors.bg.card,
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: "700",
              color: colors.text.primary,
              marginTop: 0,
              marginBottom: "1.5rem",
            }}
          >
            About the Artic Quiz
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: "1.75",
              color: colors.text.secondary,
              marginBottom: "2rem",
            }}
          >
            The Artic Quiz is a daily quiz game that tests your knowledge of
            artworks from the Art Institute of Chicago&apos;s collection. Each
            day, a new set of questions is generated based on a selected
            artwork.
          </p>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.75",
              color: colors.text.secondary,
              marginBottom: "2rem",
            }}
          >
            The quiz fetches data from the Art Institute of Chicago&apos;s
            public API to create engaging questions. Players can answer
            multiple-choice questions and receive instant feedback.
          </p>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
          >
            Development
          </h2>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.75",
              color: colors.text.secondary,
              marginBottom: "2rem",
            }}
          >
            This project is developed using modern web technologies including
            React and Next.js. It leverages server-side functions to fetch and
            process quiz data efficiently.
          </p>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: colors.text.primary,
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
          >
            More
          </h2>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.75",
              color: colors.text.secondary,
              marginBottom: 0,
            }}
          >
            To Learn more please visit the{" "}
            <a href="https://www.linkedin.com/posts/jaimegd_as-a-fan-of-the-art-institute-of-chicago-activity-7412568313039347713-9zu5">
              Blog post
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
