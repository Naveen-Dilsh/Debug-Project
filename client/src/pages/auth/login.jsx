import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { decodeToken } from "react-jwt";
import OtpInput from "react-otp-input";

import FormZ from "../../components/FormZ";
import ModalZ from "../../components/ModalZ";

import { sendNotify, fetchApi } from "../../helper";
import { checkLogged } from "../../store/auth/authSlice";

import LoadingImg from "../../assets/img/loading.png";

export default function Login() {
  const dispatch = useDispatch();
  const formRef = useRef();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [customError, setCustomError] = useState({});
  const [resetModalShow, setResetModalShow] = useState(false);
  const [contactBtnShow, setContactBtnShow] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(null);
  const [activateModalShow, setActivateModalShow] = useState(false);

  let formSchema = [
    {
      name: "email",
      value: "",
      type: "text",
      label: "Email Address",
      placeholder: "Enter email address",
      required: true,
    },
    {
      name: "password",
      value: "",
      type: "password",
      label: "Password",
      placeholder: "Enter password",
      required: true,
    },
  ];

  const onChange = (data) => {
    setFormData(data);
    setCustomError({});
  };

  const login = () => {
    let valid = formRef.current.validForm();
    if (valid) {
      setLoading(true);
      let obj = formRef.current.getPayload();
      let payload = {
        method: "post",
        url: "/auth/login",
        data: obj,
      };
      fetchApi(payload)
        .then((response) => {
          if (response) {
            setLoading(false);
            if (response?.error) {
              let meg = response?.error?.response?.data?.message;

              if (meg == "Invalid credentials.") {
                setCustomError({
                  password: "Incorrect password. Please try again.",
                });
              } else if (meg == "Invalid user.") {
                setCustomError({
                  email: "This email address is not registered with us.",
                });
              } else if (meg == "Account pending.") {
                setCustomError({
                  email: "Account setup is not complete yet.",
                });
              } else if (meg == "Account inactive.") {
                setCustomError({
                  email:
                    "Access has been removed. \n Click “Contact Support” to request reactivation.",
                });
                setContactBtnShow(true);
              } else {
                sendNotify("error", response?.error?.response?.data?.message);
              }
            } else {
              sendNotify("success", response?.message);
              let accessToken = JSON.stringify(response?.data?.accessToken); //local api

            //  let accessToken = JSON.stringify(response?.data?.tokenObj?.accessToken); //  live api
              let decode = decodeToken(accessToken);
              console.log("decode---> : "+JSON.stringify(decode));
              let currentUser = {
                email: decode.email,
                id: decode.id,
                role: decode.role,
                username: decode.username,
                firstName: decode.firstName,
                lastName: decode.lastName,
                twoFactor: decode.twoFactor,
              };
              localStorage.setItem(
                process.env.REACT_APP_CURRENT_USER,
                JSON.stringify(currentUser)
              );
              localStorage.setItem(
                'CURRUNT_USER_ID',
                String(decode?.id)
              );
              if (decode?.twoFactor) {
                setTwoFactorModal(true);
                setUserId(decode?.id);
                setToken(accessToken);
              } else {
                console.log (accessToken, "kavishkar")
                localStorage.setItem(
                  process.env.REACT_APP_JWT_TOKEN,
                  accessToken?.replace(/\"/g, "")
                );
                dispatch(checkLogged());
              }
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    }
  };

  const forgotPass = () => {
    let { email } = formRef.current.getPayload();

    var emailValidate =
      /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (email) {
      if (emailValidate.test(email)) {
        setLoading(true);
        let payload = {
          method: "post",
          url: "/auth/forgot-password",
          data: { email },
        };
        fetchApi(payload)
          .then((response) => {
            if (response) {
              setLoading(false);
              if (response.error) {
                let meg = response.error?.response?.data?.message;
                if (meg == "Invalid user") {
                  setCustomError({
                    email: "This email address is not registered with us.",
                  });
                } else {
                  sendNotify("error", response?.error?.response?.data?.message);
                }
              } else {
                setResetModalShow(true);
                formRef.current.clearForm();
              }
            }
          })
          .catch((error) => ({ error: JSON.stringify(error) }));
      } else {
        setCustomError({
          email: "Please enter a valid email address.",
        });
      }
    } else {
      setCustomError({
        email: "Please enter your email to reset your password.",
      });
    }
  };

  const verifyTwoFactor = () => {
    if (twoFactorCode) {
      let payload = {
        method: "POST",
        url: "/auth/verify-two-factor",
        data: { userId, otp: twoFactorCode },
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            if (!response.error) {
              setTwoFactorModal(true);
              localStorage.setItem(
                process.env.REACT_APP_JWT_TOKEN,
                token?.replace(/\"/g, "")
              );
              dispatch(checkLogged());
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Please enter the code.");
    }
  };

  const reqActivation = () => {
    setLoading(true);
    let obj = formRef.current.getPayload();
    let payload = {
      method: "post",
      url: "/auth/request-activation",
      data: obj,
    };
    fetchApi(payload)
      .then((response) => {
        if (response) {
          setLoading(false);
          if (response?.error) {
            let meg = response?.error?.response?.data?.message;

            if (meg == "Invalid credentials.") {
              setCustomError({
                password: "Incorrect password. Please try again.",
              });
            } else if (meg == "Invalid user.") {
              setCustomError({
                email: "This email address is not registered with us.",
              });
            } else {
              sendNotify("error", response?.error?.response?.data?.message);
            }
          } else {
            setActivateModalShow(true);
            setContactBtnShow(false);
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  return (
    <div className="auth-form">
      <FormZ
        ref={formRef}
        formSchema={formSchema}
        formData={formData}
        onKeyPress={login}
        onChange={onChange}
        customValidation={customError}
      />
      <button
        className="auth-link my-5"
        onClick={forgotPass}
        disabled={loading}
      >
        Forgot Password?
      </button>
      <button
        className={`primary-btn auth-btn mb-4`}
        onClick={login}
        disabled={loading}
      >
        Log In
      </button>
      <button
        onClick={reqActivation}
        className={`secondary-btn auth-btn ${
          contactBtnShow ? "d-black" : "d-none"
        }`}
      >
        Contact Support
      </button>
      {loading && <img className="auth-loading" src={LoadingImg} />}
      <ModalZ
        show={resetModalShow}
        title={
          <>
            <i className="ri-mail-fill"></i> Password Reset Requested
          </>
        }
        onOk={() => setResetModalShow(false)}
        onCancel={() => setResetModalShow(false)}
      >
        <p>
          We've notified our team to reset your password. Soon, you'll receive
          an email with a link to set up a new password.
        </p>
      </ModalZ>
      <ModalZ
        show={activateModalShow}
        title={
          <>
            <i className="ri-mail-fill"></i> Activation Requested
          </>
        }
        onOk={() => setActivateModalShow(false)}
        onCancel={() => setActivateModalShow(false)}
      >
        <p>
          We've notified our team to activate your account. Soon, you'll receive
          a notification via email.
        </p>
      </ModalZ>
      <ModalZ
        show={twoFactorModal}
        title={
          <>
            <i className="ri-qr-code-line"></i> 2-Factor Authentication
          </>
        }
        onOk={verifyTwoFactor}
        onCancel={() => setTwoFactorModal(false)}
        okBtnText="Submit"
      >
        <p className="mb-3">
          Please enter the code which showed in the authenticator app
        </p>
        <OtpInput
          value={twoFactorCode}
          onChange={setTwoFactorCode}
          numInputs={6}
          containerStyle="auth-otp-wrapper mb-3"
          renderInput={(props) => (
            <input {...props} placeholder="0" type="number" />
          )}
        />
      </ModalZ>
    </div>
  );
}
