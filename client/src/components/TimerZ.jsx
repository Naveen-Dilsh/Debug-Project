import { useEffect, useState } from "react";

import { showCount } from "../helper";

export default function TimerZ({ start, stop, reset, defaultTime, getTime }) {
  const [time, setTime] = useState({
    ms: 0,
    sec: 0,
    min: 0,
    hr: 0,
  });

  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (defaultTime) {
      setTime(defaultTime);
    }
    if (start || stop) {
      pauseOrResume();
    }
    if (reset) {
      resetTimer();
    }
  }, [start, stop, defaultTime]);

  useEffect(() => {
    if (getTime !== undefined) {
      getTime(time);
    }
  }, [time["sec"]]);

  const updateTimer = () => {
    setTime((prev) => {
      let newTime = { ...prev };
      if (newTime.ms < 99) {
        newTime.ms += 1;
      } else {
        newTime.ms = 0;
        if (newTime.sec < 59) {
          newTime.sec += 1;
        } else {
          newTime.sec = 0;
          newTime.min += 1;
        }
        if (newTime.min === 60) {
          newTime.min = 0;
          newTime.hr += 1;
        }
      }
      return newTime;
    });
  };

  const pauseOrResume = () => {
    if (!intervalId) {
      let id = setInterval(updateTimer, 10);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setTime({
      ms: 0,
      sec: 0,
      min: 0,
      hr: 0,
    });
  };

  return (
    <div className="timer-wrapper">
      <i className="ri-play-line"></i>
      <p>
        {showCount(time.hr)}:{showCount(time.min)}:{showCount(time.sec)}
      </p>
    </div>
  );
}
