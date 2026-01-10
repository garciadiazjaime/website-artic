import Quiz from "./quiz";

export default async function Home() {
  const today = new Date().toJSON().split("T")[0];
  const quiz = await fetch(`${process.env.QUIZ_URL}/${today}.json`).then(
    (res) => res.json()
  );

  return <Quiz quiz={quiz} />;
}
