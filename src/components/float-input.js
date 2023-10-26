import React from "react";
import "../styles/float-input.scss";

const FloatInput = ({
  handleChange,
  handleKeyDown,
  type,
  tagId,
  value,
  defaultValue,
}) => {
  return (
    <div className="float-input">
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        type={type}
        id={tagId}
        placeholder=" "
        value={defaultValue}
      />
      <label htmlFor={tagId}>{value}</label>
    </div>
  );
};

export default FloatInput;
