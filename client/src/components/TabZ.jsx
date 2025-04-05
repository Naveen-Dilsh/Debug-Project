import { useEffect, useState } from "react";

export default function TabZ({ labels, defaultActive, onChange, customClass }) {
  const [activeNow, setActiveNow] = useState(null);

  useEffect(() => {
    setActiveNow(defaultActive);
  }, [defaultActive]);

  const getTabChange = (key) => {
    setActiveNow(key);
    if (onChange) {
      onChange(key);
    }
  };

  return (
    <div className={`tab-z ${customClass ?? ""}`}>
      <div className="tab-z-labels">
        {labels?.length > 0 ? (
          labels?.map((l, i) => {
            return (
              <div
                key={i}
                className={`tab-z-option ${
                  activeNow == l?.key ? "active" : ""
                }`}
                onClick={() => getTabChange(l?.key)}
              >
                <label htmlFor="">{l?.label}</label>
              </div>
            );
          })
        ) : (
          <p>Labels are required</p>
        )}
      </div>
    </div>
  );
}
