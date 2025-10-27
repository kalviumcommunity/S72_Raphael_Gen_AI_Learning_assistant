import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [quizExited, setQuizExited] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const navigate = useNavigate();

  const questions = [
    {
      question: "Which of the following is a JavaScript framework?",
      options: ["Django", "Flask", "React", "Laravel"],
      correct: "React",
    },
    {
      question: "Which HTML tag is used to link an external JavaScript file?",
      options: ["<link>", "<js>", "<script>", "<src>"],
      correct: "<script>",
    },
    {
      question: "What is the correct syntax to declare a constant in JS?",
      options: ["let x = 10;", "var x = 10;", "const x = 10;", "constant x = 10;"],
      correct: "const x = 10;",
    },
    {
      question: "In MongoDB, which command is used to insert a document?",
      options: [
        "db.collection.insert()",
        "db.collection.add()",
        "db.insertOne()",
        "db.addDocument()",
      ],
      correct: "db.collection.insert()",
    },
    {
      question: "Which method is used to fetch data in React?",
      options: ["fetchData()", "getData()", "useFetch()", "fetch()"],
      correct: "fetch()",
    },
  ];

useEffect(() => {
  const enterFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };
  enterFullscreen();

  const handleFullscreenChange = () => {
    // ✅ Only trigger during quiz, not after finishing
    if (!document.fullscreenElement && !document.webkitFullscreenElement && score === null) {
      setQuizExited(true);
      setScore(0);
      setShowExitPopup(true);

      setTimeout(() => {
        setShowExitPopup(false);
        navigate("/");
      }, 3000);
    }
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
  };
}, [navigate, score]);

  const handleAnswer = (option) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: option }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    let total = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) total++;
    });
    setScore(total);
    document.exitFullscreen?.();
  };

  const handleRestart = () => {
    setAnswers({});
    setScore(null);
    setCurrentQuestion(0);
  };

  if (quizExited) {
    return (
      <div className="h-screen bg-gray-900 text-gray-200 flex items-center justify-center relative">
        <h1 className="text-3xl font-bold text-red-400">Quiz exited — score: 0</h1>

        {showExitPopup && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-red-500 text-red-300 px-10 py-8 rounded-2xl shadow-xl text-center">
              <h2 className="text-2xl font-bold mb-2">You exited the quiz!</h2>
              <p className="text-lg">Your score is 0. Returning to home...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // (Everything else stays identical below)
  if (score !== null) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center py-12 px-6">
        <h1 className="text-4xl font-bold text-indigo-400 mb-6">Quiz Complete!</h1>
        <p className="text-2xl mb-10">
          Your Score:{" "}
          <span className="text-indigo-300 font-semibold">
            {score} / {questions.length}
          </span>
        </p>
        <div className="w-full max-w-4xl space-y-8">
          {questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correct;
            return (
              <div
                key={index}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">
                  {index + 1}. {q.question}
                </h3>
                <div className="grid gap-3">
                  {q.options.map((option, i) => {
                    const isUserAnswer = userAnswer === option;
                    const isRightAnswer = q.correct === option;
                    return (
                      <div
                        key={i}
                        className={`px-5 py-3 rounded-lg border transition-all text-lg ${
                          isRightAnswer
                            ? "bg-green-600/30 border-green-500 text-green-200"
                            : isUserAnswer
                            ? "bg-red-600/30 border-red-500 text-red-200"
                            : "bg-gray-700 border-gray-600 text-gray-300"
                        }`}
                      >
                        {option}
                        {isRightAnswer && " ✅"}
                        {isUserAnswer && !isRightAnswer && " ❌"}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex gap-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition"
          >
            Retry Quiz
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-700 rounded-lg text-white font-semibold hover:bg-gray-600 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-gray-800 rounded-2xl p-10 shadow-2xl border border-indigo-400">
        <h2 className="text-2xl font-semibold text-indigo-300 mb-6">
          Question {currentQuestion + 1} of {questions.length}
        </h2>
        <p className="text-xl mb-8">{currentQ.question}</p>
        <div className="grid gap-4">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className={`px-6 py-3 rounded-lg border text-left text-lg transition-all ${
                answers[currentQuestion] === option
                  ? "bg-indigo-600 border-indigo-400 text-white"
                  : "bg-gray-700 border-gray-600 hover:bg-gray-600"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {currentQuestion < questions.length - 1 ? "Next ➜" : "Finish ✅"}
          </button>
        </div>
      </div>
    </div>
  );
}
