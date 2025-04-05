import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isExpired, decodeToken } from "react-jwt";

// import Logo from "../../assets/img/logo.png";
import FormZ from "../../components/FormZ";
import { sendNotify, fetchApi } from "../../helper";

export default function SignUp() {
  const formRef = useRef();

  let { token } = useParams();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [customError, setCustomError] = useState({});
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [passValid, setPassValid] = useState({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      let expired = isExpired(token);
      if (expired) {
        sendNotify("error", "Sign-up link was expired!");
      } else {
        let raw = decodeToken(token);
        setFormData(raw);
        setUserId(raw["id"]);
      }
    } else {
      sendNotify("error", "Invalid sign-up link");
    }
  }, [token]);

  let formSchema = [
    {
      name: "email",
      value: "",
      type: "text",
      label: "Email",
      placeholder: "Enter email",
      required: true,
      disabled: true,
    },
    {
      name: "username",
      value: "",
      type: "text",
      label: "Username",
      placeholder: "Enter username",
      required: true,
      infoIcon: (
        <span
          className={`input-after ${
            customError["username"]
              ? "color-red"
              : usernameLoading
              ? "icon-spin-ani"
              : "color-green"
          }`}
        >
          {formData["username"] && (
            <i
              className={
                customError["username"]
                  ? "ri-close-circle-line"
                  : usernameLoading
                  ? "ri-loader-4-line"
                  : "ri-checkbox-circle-line"
              }
            ></i>
          )}
        </span>
      ),
    },
    {
      name: "password",
      value: "",
      type: "password",
      label: "Password",
      placeholder: "Enter password",
      required: true,
      autoComplete: false,
      customClass: "mb-2",
      validation: true,
    },
    {
      customElement: (
        <ul
          className={`pass-validation ${formData["password"] ? "pass-in" : ""}`}
        >
          <li className={passValid["length"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["length"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            Password should be more than 8 characters
          </li>
          <li className={passValid["upper"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["upper"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            Should include uppercase and lowercase letters
          </li>
          <li className={passValid["number"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["number"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            Should include atleast one number
          </li>
          <li className={passValid["special"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["special"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            Should include atleast one special character
          </li>
        </ul>
      ),
    },
    {
      name: "confirmPassword",
      value: "",
      type: "password",
      label: "Confirm Password",
      validation: false,
      placeholder: "Enter confirm password",
      required: true,
    },
  ];

  const getFormData = (data, field) => {
    let { username, password } = data;
    let valid = { ...passValid };
    let error = { ...customError };

    valid["upper"] = /[A-Z]/?.test(password);
    valid["number"] = /[0-9]/?.test(password);
    valid["special"] = /[(@!#\$%\^\&*\)\(+=._-]/?.test(password);
    valid["length"] = password?.length > 8;

    if (field == "username") {
      if (username) {
        if (username.length <= 15) {
          if (/[(@!#\$%\^\&*\)\(+=._-]/?.test(username)) {
            error["username"] = "Use only letters (a-z) and numbers (0-9) only";
          } else {
            setUsernameLoading(true);
            let payload = {
              method: "post",
              url: "/auth/check-username",
              data: { username },
            };
            fetchApi(payload)
              .then((response) => {
                if (response) {
                  setUsernameLoading(false);
                  if (response.error) {
                    error["username"] = "Username is not available.";
                  } else {
                    error["username"] = "";
                  }
                  setCustomError(error);
                }
              })
              .catch((error) => ({ error: JSON.stringify(error) }));
          }
        } else {
          error["username"] = "Max length 15 characters only";
          setCustomError(error);
        }
      } else {
        error["username"] = "Username is required";
        setCustomError(error);
      }
    }
    setPassValid(valid);
    setFormData(data);
  };

  const signUp = () => {
    let valid = formRef.current.validForm();
    if (valid && Object.keys(passValid).every((k) => passValid[k])) {
      setLoading(true);
      let obj = formRef.current.getPayload();
      delete obj["email"];
      delete obj["confirmPassword"];
      console.log(userId);
      let payload = {
        method: "post",
        url: "/auth/register",
        data: { id: userId, ...obj },
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            setLoading(false);
            if (!response?.error) {
              navigate("/login");
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Form validation failed.");
    }
  };

  return (
    <div className="auth-form">
      <FormZ
        formSchema={formSchema}
        ref={formRef}
        onChange={getFormData}
        formData={formData}
        customValidation={customError}
      />
      <button
        className={`primary-btn mt-5 auth-btn ${loading ? "btn-loading" : ""}`}
        onClick={signUp}
      >
        {loading ? <i className="far fa-spinner-third fa-spin"></i> : ""}
        Sign Up
      </button>
    </div>
  );
}
