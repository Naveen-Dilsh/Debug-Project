import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "antd";

import { checkThemeMode } from "../store/theme/themeSlice";

export default function Theme() {
  const dispatch = useDispatch();

  let theme = useSelector((state) => state.theme.themeMode);

  const [themeMode, setThemeMode] = useState(null);

  useEffect(() => {
    setThemeMode(theme == "dark" ? true : false);
  }, [theme]);

  const toggleTheme = (checked) => {
    setThemeMode(checked);
    localStorage.setItem("selected-theme", checked ? "dark" : "light");
    dispatch(checkThemeMode());
  };

  return (
    <div>
      <Switch checked={themeMode} onChange={toggleTheme} />
    </div>
  );
}
