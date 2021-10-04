import { useEffect, useState } from "react";

function useVisualMode(initial) {
  const [mode, setMode] = useState(initial);
  const [history, setHistory] = useState([initial]);
  useEffect(() => {
    setMode(history[history.length - 1]);
  }, [history]);

  const transition = (newMode, replace = false) => {
    if (replace) {
      setHistory([...history.slice(0, history.length - 1), newMode]);
    } else {
      setHistory([...history, newMode]);
    }
  };
  const back = () => {
    if (mode === initial) return;
    setHistory(history.slice(0, history.length - 1));
  };
  return { mode, transition, back };
}

export default useVisualMode;
