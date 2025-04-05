import { useState, useEffect } from "react";

import { createEmptyArray, Each } from "../helper";

export default function SlidesZ({ current, total }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    let arr = createEmptyArray(total);
    setSteps(arr);
  }, [total]);

  return (
    <div className="slide-dots-z mt-3">
      <Each
        array={steps}
        render={(step) => {
          return (
            <div
              className={`slide-z ${step == current - 1 ? "active" : ""}`}
            ></div>
          );
        }}
      />
    </div>
  );
}
