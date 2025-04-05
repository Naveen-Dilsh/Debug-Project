import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isExpired, decodeToken } from "react-jwt";

import FormZ from "../../components/FormZ";
import ModalZ from "../../components/ModalZ";

import { sendNotify, fetchApi } from "../../helper";

import LoadingImg from "../../assets/img/loading.png";

export default function SignUp() {
  const formRef = useRef();

  const navigate = useNavigate();

  let { token } = useParams();

  const [userId, setUserId] = useState(null);
  const [tokenErr, setTokenErr] = useState(false);
  const [verifyId, setVerifyId] = useState(null);
  const [formData, setFormData] = useState({});
  const [passValid, setPassValid] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetModalShow, setResetModalShow] = useState(false);

  useEffect(() => {
    if (token) {
      let expired = isExpired(token);
      if (expired) {
        setTokenErr(true);
        sendNotify("error", "Reset password link was expired!");
      } else {
        let raw = decodeToken(token);
        setFormData(raw);
        setUserId(raw["id"]);
        setVerifyId(raw["verifyId"]);
      }
    } else {
      setTokenErr(true);
      sendNotify("error", "Invalid reset password link");
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
            ></i>{" "}
            Password is more than 8 characters
          </li>
          <li className={passValid["upper"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["upper"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>{" "}
            Upper and lowercase letters
          </li>
          <li className={passValid["number"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["number"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>{" "}
            At least one number
          </li>
          <li className={passValid["special"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["special"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>{" "}
            At least one special character
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
    let { password } = data;
    let valid = { ...passValid };

    valid["upper"] = /[A-Z]/?.test(password);
    valid["number"] = /[0-9]/?.test(password);
    valid["special"] = /[(@!#\$%\^\&*\)\(+=._-]/?.test(password);
    valid["length"] = password?.length > 8;

    setPassValid(valid);
    setFormData(data);
  };

  const resetPass = () => {
    let valid = formRef.current.validForm();
    if (valid && Object.keys(passValid).every((k) => passValid[k])) {
      setLoading(true);
      let obj = formRef.current.getPayload();
      delete obj["email"];
      delete obj["confirmPassword"];
      console.log(userId);
      let payload = {
        method: "post",
        url: "/auth/reset-password",
        data: { id: userId, ...obj, verifyId },
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            setLoading(false);
            // if (!response?.error) {
            //   navigate("/login");
            // }
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
      />
      <button
        className="primary-btn mt-5 auth-btn"
        disabled={loading || tokenErr}
        onClick={!tokenErr ? resetPass : () => {}}
      >
        Change Password
      </button>
      {loading && (
        <div className="text-center mt-5">
          <img className="auth-loading" src={LoadingImg} />
        </div>
      )}
      <ModalZ
        show={resetModalShow}
        title={
          <>
            <i className="ri-checkbox-circle-fill color-green"></i> Password
            Reset Successful
          </>
        }
        onOk={() => setResetModalShow(false)}
        onCancel={() => setResetModalShow(false)}
      >
        <p>
          Your password has been updated successfully. You can now log in with
          your new password.
        </p>
      </ModalZ>
    </div>
  );
}
