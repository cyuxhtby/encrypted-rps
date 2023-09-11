import "./App.css";
import { useState, useEffect } from "react";
import { init, getInstance } from "./utils/fhevm";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import { Connect } from "./Connect";
import RpsGame from "./components/RpsGame.jsx";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error("Initialization error:", error);
        setInitializationError(true);
        setIsInitialized(false);
      });
  }, []);

  if (!isInitialized && !initializationError) return <p>Initializing...</p>;
  if (initializationError) return <p>Error initializing the app.</p>;

  return (
    <Router>
      <div className="App flex flex-col justify-center h-screen font-press-start text-black">
        <div>
          <Connect>
            {(account, provider) => (
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route exact path="/rps-game" element={<RpsGame />} />
                {/* Add more routes for other pages here */}
              </Routes>
            )}
          </Connect>
        </div>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      <Link
          className="text-black hover:text-blue-500 transition duration-300 my-2"
          to="/rps-game"
        >
          Play
        </Link>
    </div>
  );
}

export default App;
