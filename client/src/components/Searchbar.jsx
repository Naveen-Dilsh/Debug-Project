import React from 'react';
import '../assets/css/style.scss';

const SearchBar = ({ placeholder, searchTerm, setSearchTerm }) => {
  return (
    <div className="searchBar">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
