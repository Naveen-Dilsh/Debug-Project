import { useState } from "react";

export default function SelectZ(props) {
  let { options, onChange, search } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [searchText, setSearchText] = useState("");

  const getSelected = (v) => {
    onChange(v?.value);
    setSelected(v);
    setIsOpen(false);
  };

  function toggleDropdown() {
    console.log("sdfasf");
    setIsOpen(!isOpen);
  }

  return (
    <div className="select-z" onPointerLeave={() => setIsOpen(false)}>
      <div className="select-z-input-wrapper">
        <input
          className="select-z-input"
          type="text"
          placeholder="Select any"
          value={search ? searchText : selected?.label ?? ""}
          onClick={() => setIsOpen(true)}
          onChange={search ? (e) => setSearchText(e.target.value) : null}
          readOnly={!search}
        />
        <i className="ri-arrow-down-s-line"></i>
      </div>
      <div
        className={`select-z-dropdown ${
          isOpen ? "select-z-dropdown-open" : ""
        }`}
      >
        {options?.length ? (
          <ul>
            {options.map((option, i) => {
              return (
                <li key={i} onClick={() => getSelected(option)}>
                  {option.label}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No Options are given</p>
        )}
      </div>
    </div>
  );
}
