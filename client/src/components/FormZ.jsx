import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import { Tooltip, Select, Switch, DatePicker } from "antd";
import dayjs from "dayjs";

const FormZ = forwardRef((props, ref) => {
  let {
    formSchema,
    formData,
    theme,
    formClass,
    childClass,
    labelClass,
    inputClass,
    formOptions,
    updateOptions,
    onKeyPress,
    disabled,
    onChange,
    onKeyUp,
    customValidation,
  } = props;

  const [formValues, setFormValues] = useState({});
  const [options, setOptions] = useState([]);
  const [togglePass, setTogglePass] = useState({});
  const [capsLock, setCapsLock] = useState("");

  useEffect(() => {
    updateSchema();
  }, [formSchema]);

  useEffect(() => {
    getFormFields();
  }, [formData]);

  useEffect(() => {
    if (formOptions) {
      setOptions(formOptions);
    }
  }, [formOptions]);

  useEffect(() => {
    if (customValidation && Object.keys(customValidation)?.length != 0) {
      let obj = { ...formValues };
      Object.keys(customValidation).forEach(function (key, index) {
        obj[key].error = customValidation[key];
      });
      setFormValues(obj);
    }
  }, [customValidation]);

  const updateSchema = () => {
    let formFields = { ...formValues };
    let pass = {};
    formSchema.map(
      (tag) => (
        (formFields[tag.name] = {
          value: formData ? formData[tag.name] : tag.value,
          error: "",
          required: tag.required ? true : false,
        }),
        (pass[tag.name] = false)
      )
    );

    setFormValues(formFields);
  };

  const getFormFields = () => {
    let formFields = { ...formValues };
    if (Object.keys(formFields)?.length !== 0) {
      Object.keys(formFields).map(function (key) {
        let obj = { ...formFields[key] };
        obj["value"] = formData[key] ?? "";
        formFields[key] = obj;
      });
      setFormValues(formFields);
    } else {
      updateSchema();
    }
  };

  const togglePassword = (key) => {
    let pass = { ...togglePass };
    pass[key] = !pass[key];
    setTogglePass(pass);
  };

  const keyUpHandle = (e) => {
    let isCaps = e.getModifierState("CapsLock");
    if (isCaps) {
      setCapsLock("Caps lock is on");
    } else {
      setCapsLock("");
    }
  };

  function getInputElement(index, input) {
    switch (input.type) {
      case "select":
        return (
          <Select
            mode={input?.mode}
            showSearch={input?.showSearch || false}
            allowClear={input?.allowClear || false}
            filterOption={filterOption}
            value={formValues[input.name]?.value}
            loading={input?.loading ?? false}
            disabled={input?.disabled || disabled}
            className={`custom-select w-100 ${input?.inputClass}`}
            placeholder={input?.placeholder}
            onChange={(value) => getInputValue(input?.name, value)}
            onKeyUp={onKeyUp ? onKeyUp : null}
            options={
              input?.options ||
              input?.options?.length > 0 ||
              options[input.name]
            }
          />
        );
      case "textarea":
        return (
          <textarea
            name={input?.name}
            style={input?.style}
            placeholder={input?.placeholder}
            value={formValues[input.name]?.value || ""}
            onChange={(e) => getInputValue(input?.name, e.target.value)}
            disabled={input?.disabled || disabled}
          ></textarea>
        );
      case "switch":
        return (
          <div className="d-flex align-items-center mt-2">
            <Switch
              className="custom-switch"
              checked={formValues[input.name]?.value}
              onChange={(value) => getInputValue(input?.name, value)}
            />
            <h6 className="mb-0 ms-2">
              {formValues[input.name]?.value ? "Enabled" : "Disabled"}
            </h6>
          </div>
        );
      case "date":
        return (
          <DatePicker
            className="custom-datepicker w-100"
            dateFormat="DD-MM-YYYY HH:mm:ss"
            showTime={input?.showTime || false}
            placeholder={input?.placeholder}
            format={input?.format}
            disabled={input?.disabled || disabled}
            value={
              formValues[input.name]?.value
                ? dayjs(formValues[input.name]?.value)
                : ""
            }
            onChange={(value) => getInputValue(input?.name, value)}
          />
        );
      default:
        return (
          <div
            className={`input-field ${
              disabled || input?.disabled ? "input-disabled" : ""
            } ${
              input?.type == "password" && !input?.disabled
                ? "input-password"
                : ""
            } ${inputClass ?? ""}`}
          >
            <input
              type={
                input?.type == "password"
                  ? togglePass[input?.name]
                    ? "text"
                    : "password"
                  : input?.type
              }
              name={input?.name}
              placeholder={input?.placeholder}
              value={formValues[input.name]?.value || ""}
              onChange={(e) => getInputValue(input?.name, e.target?.value)}
              disabled={input?.disabled}
              autoComplete="off"
              aria-autocomplete="none"
              onKeyPress={(e) =>
                e.key === "Enter" &&
                typeof onKeyPress !== "undefined" &&
                onKeyPress()
              }
              onKeyUp={keyUpHandle}
            />
            {input?.infoIcon}
            {input?.tooltip && (
              <Tooltip title={input.tooltip?.message}>
                <button className="input-after">
                  <i className="fal fa-info-circle"></i>
                </button>
              </Tooltip>
            )}
            {input?.type == "password" && !input?.disabled && (
              <button
                type="button"
                className="input-after"
                onClick={() => togglePassword(input?.name)}
              >
                <i
                  className={
                    togglePass[input?.name]
                      ? "ri-eye-line"
                      : "ri-eye-close-line"
                  }
                ></i>
              </button>
            )}
          </div>
        );
    }
  }

  var emailValidate =
    /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  var passValidate =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
  var passErrMeg =
    "Password must be 8 to 15 characters at least one uppercase letter, one numeric digit, and one special character";

  const getInputValue = (field, value) => {
    let values = { ...formValues };
    values[field].value = value;
    if (values[field].required) {
      if (value && value !== " ") {
        values[field].error = customValidation
          ? customValidation[field] ?? ""
          : "";
        if (field == "email")
          if (!emailValidate.test(value))
            values[field].error = "Please enter a valid email address.";
        if (field == "password" || field == "confirmPassword") {
          if (values["confirmPassword"]?.value) {
            if (values["password"]?.value != values["confirmPassword"]?.value) {
              values["confirmPassword"].error = "Passwords do not match.";
            } else {
              values["confirmPassword"].error = "";
            }
          }
        }
        if (field == "password" && formSchema["password"]?.validation)
          if (!value.match(passValidate))
            values[field].error = (
              <>
                Invalid password{" "}
                <Tooltip placement="top" title={passErrMeg}>
                  <i className="far fa-question-circle"></i>
                </Tooltip>
              </>
            );
      } else {
        values[field].error = `${field
          .replace("_", " ")
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, function (str) {
            return str.toUpperCase();
          })} is required`;
      }
    }
    if (updateOptions) {
      updateOptions(value);
    }
    setFormValues(values);
    getOnChange(field);
  };

  function getOnChange(field) {
    let values = { ...formValues };
    let payload = {};
    for (var key in values) {
      if (values[key]?.value) {
        payload[key] = values[key]?.value;
      }
    }
    if (typeof onChange !== "undefined") {
      onChange(payload, field);
    }
  }

  function checkEmpty() {
    let values = { ...formValues };
    let emptyArr = [];
    for (var key in values) {
      if (values[key].required) {
        if (
          values[key].value === "" ||
          values[key].value === null ||
          values[key].value === undefined ||
          values[key].error !== ""
        ) {
          emptyArr.push(key);
        }
      }
    }
    return emptyArr;
  }

  useImperativeHandle(ref, () => ({
    validForm() {
      let values = { ...formValues };
      let empty = checkEmpty();
      if (empty?.length > 0) {
        empty.forEach((field) => {
          if (values[field].value) {
            if (field == "email")
              if (!emailValidate.test(values[field].value))
                values[field].error = "Enter valid email address";
          } else {
            values[field].error = `${field
              .replace("_", " ")
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, function (str) {
                return str.toUpperCase();
              })} is required`;
          }
        });
      } else {
        return true;
      }
      setFormValues(values);
      return false;
    },

    getPayload() {
      let values = { ...formValues };
      let payload = {};
      for (var key in values) {
        if (values[key]?.value) {
          payload[key] = values[key]?.value;
        }
      }
      return payload;
    },

    clearForm() {
      let formFields = { ...formValues };
      Object.keys(formFields).map(function (key) {
        let obj = { ...formFields[key] };
        obj["value"] = "";
        formFields[key] = obj;
      });
      setFormValues(formFields);
      setTogglePass(false);
    },
  }));

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <div className={formClass ?? ""}>
      {formSchema &&
        formSchema?.map((input, index) => {
          return (
            <div
              key={index}
              className={`${childClass ?? ""} input-box ${
                input?.required ? "req" : ""
              } ${formValues[input.name]?.error ? "input-error" : ""} ${
                input?.customClass ?? ""
              }`}
            >
              {input?.label && (
                <label
                  className={`${labelClass ?? ""} ${input?.labelClass ?? ""}`}
                  htmlFor={input?.name}
                >
                  {input?.label}
                  {formValues[input.name]?.error !== "" ? (
                    <span className="err-meg">
                      {formValues[input.name]?.error}
                    </span>
                  ) : (
                    <span className="war-meg">
                      {input?.type == "password" ? capsLock : ""}
                    </span>
                  )}
                </label>
              )}
              {input.customElement ?? getInputElement(index, input)}
            </div>
          );
        })}
    </div>
  );
});

export default FormZ;
