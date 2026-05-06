import { useEffect, useState } from "react";

export function useTypewriter(text, speed = 25, startDelay = 0) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setOut("");
    setDone(false);
  }

  useEffect(() => {
    let i = 0;
    let intervalId;
    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return [out, done];
}
