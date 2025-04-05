import { useState } from "react";

export default function SearchBoxZ({
  placeholder,
  onSearch,
  onChange,
  onClear,
}) {
  const [search, setSearch] = useState("");

  const searchOnChange = (value) => {
    setSearch(value);
    if (onChange !== undefined) {
      onChange(value);
    }
  };

  const searchOnClick = () => {
    if (onSearch !== undefined) {
      onSearch(search);
    }
  };

  const searchOnClear = () => {
    setSearch("");
    if (onClear !== undefined) {
      onClear("");
    }
  };

  return (
    <div className="search-box-z">
      <input
        type="text"
        value={search}
        onChange={(e) => searchOnChange(e.target.value)}
        placeholder={placeholder ?? "Search here..."}
        onKeyPress={(e) => e.key === "Enter" && searchOnClick()}
      />
      <button
        className={`clear-btn ${search !== "" ? "active" : ""}`}
        onClick={searchOnClear}
      >
        <i className="ri-close-circle-fill"></i>
      </button>
      <button className="search-btn" onClick={searchOnClick}>
        <i className="ri-search-line"></i>
      </button>
    </div>
  );
}
