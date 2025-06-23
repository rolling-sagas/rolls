import Markdown from "https://cdn.jsdelivr.net/npm/marked-react@3.0.0/+esm";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { parse } from "smol-toml";
import DiceBoxComponent from "@/components/dice";
import { useModalStore } from "@/components/modal";
import { useRollDice } from "@/components/dice";
import { useCallback } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { nanoid } from "nanoid";

import "./github-markdown.css";

export const TextContent = ({ content }) => {
  return (
    <div className="msg-text markdown-body">
      <Markdown>{content.value}</Markdown>
    </div>
  );
};

export const InputContent = ({ content }) => {
  return (
    <div className="msg-hbox input-container">
      <input
        type="text"
        name={content.name}
        className="msg-input"
        placeholder={content.placeholder}
      />
      <input type="submit" value="OK" className="msg-button" />
    </div>
  );
};

function getValueByPath(obj, path) {
  const keys = path.split(".");
  let current = obj;
  for (let key of keys) {
    if (!current || !Object.hasOwnProperty.call(current, key)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

export const ImageContent = ({ content }) => {
  const configs = useStore.getState().configs;
  const src = useMemo(() => {
    let basePath = content.base?.split(".");
    if (!basePath) return;
    const configName = basePath[0];
    const config = configs.find((c) => c.name === configName);
    if (!config) {
      console.warn(`Config ${configName} not found`);
      return;
    }

    const parsed = parse(config.content);
    basePath = basePath.slice(1);
    basePath = [...basePath, content.src];

    return getValueByPath(parsed, basePath.join("."));
  }, [content, configs]);

  return (
    <>
      {src && (
        <div className="msg-image-container">
          <img className="msg-image" alt={content.alt} src={src} />
        </div>
      )}
    </>
  );
};

export const SelectContent = ({ content }) => {
  const [value, setValue] = useState("");

  return (
    <div className="msg-vbox input-container">
      <input type="hidden" name={content.name} value={value} />
      {content.options &&
        content.options.map((option, idx) => (
          <button
            className="msg-button"
            key={idx}
            onClick={() => {
              setValue(option.short || option.value);
            }}
          >
            {option.label}
          </button>
        ))}
    </div>
  );
};

export const MultiSelectContent = ({ content }) => {
  const [selectedValues, setSelectedValues] = useState([]);

  const toggleValue = (val) => {
    setSelectedValues((prev) => {
      if (prev.includes(val)) {
        return prev.filter((v) => v !== val);
      } else if (!content.select || prev.length < content.select) {
        return [...prev, val];
      }
      return prev;
    });
  };

  const isSubmitDisabled = content.select
    ? selectedValues.length < content.select
    : false;

  return (
    <div className="msg-vbox input-container">
      {/* Create one hidden input per selected value */}
      {selectedValues.map((val, idx) => (
        <input key={idx} type="hidden" name={`${content.name}[]`} value={val} />
      ))}
      <div className="flex flex-wrap gap-2">
        {content.options?.map((option, idx) => {
          const val = option.short || option.value;
          const isSelected = selectedValues.includes(val);
          const id = `${nanoid()}-${idx}`;
          return (
            <div key={idx} className="msg-checkbox-wrapper">
              <input
                type="checkbox"
                id={id}
                checked={isSelected}
                onChange={() => toggleValue(val)}
                className="hidden"
              />
              <label
                htmlFor={id}
                className={`msg-button ${isSelected ? "selected" : ""}`}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      <button
        type="submit"
        className="msg-button mt-4 justify-center!"
        disabled={isSubmitDisabled}
      >
        Submit
      </button>
    </div>
  );
};

export const RollContent = ({ content }) => {
  const [value, setValue] = useState("");
  const openModal = useModalStore((state) => state.openModal);
  const rollDice = useRollDice((state) => state.rollDice);

  const submitRef = useRef(null);

  const callback = useCallback((results) => {
    setValue(results.map((result) => result.value).join(", "));
  }, []);

  useEffect(() => {
    if (value !== "") {
      submitRef.current.click();
    }
  }, [value]);

  return (
    <>
      <input type="hidden" name="roll" value={value} />
      <input type="hidden" name="skill_check" value={content.value} />
      <button
        className="msg-button input-container"
        onClick={async (evt) => {
          evt.preventDefault();
          await rollDice(content.notation, callback);
        }}
      >
        {content.label}
      </button>
      <input type="submit" className="hidden" ref={submitRef} />
    </>
  );
};

export const ButtonContent = ({ content }) => {
  return (
    <>
      <input type="hidden" name={content.name} defaultValue={content.value} />
      <input
        type="submit"
        className="msg-button input-container"
        defaultValue={content.label}
      />
    </>
  );
};
