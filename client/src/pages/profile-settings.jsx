import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import OtpInput from "react-otp-input";

import FormZ from "../components/FormZ";
import ModalZ from "../components/ModalZ";
import SlidesZ from "../components/SlidesZ";

import {
  getRandomColor,
  fetchApi,
  sendNotify,
  fileToBase64,
  getTempProfile,
} from "../helper";

import { fetchProfile } from "../store/profile/profileSlice";

export default function ProfilePicture() {
  const dispatch = useDispatch();

  const profile = useSelector((state) => state.profile);

  const profileFormRef = useRef();
  const resetFormRef = useRef();

  const [customError, setCustomError] = useState({});
  const [formData, setFormData] = useState({});
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passValid, setPassValid] = useState({});
  const [profileImg, setProfileImg] = useState(null);
  const [profileLetters, setProfileLetters] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [currStep, setCurrStep] = useState(1);
  const [verifyModal, setVerifyModal] = useState(false);

  useEffect(() => {
    setProfileImg(profile?.data?.profileImg);
    setProfileData(profile["data"]);
  }, [profile]);

  useEffect(() => {
    if (profileData?.firstName && profileData?.lastName) {
      let name = getTempProfile(profileData);
      setProfileLetters(name);
    }
  }, [profileData?.firstName, profileData?.lastName]);

  const getProfileData = () => {
    dispatch(fetchProfile());
  };

  let profileFormSchema = [
    {
      name: "email",
      value: "",
      type: "email",
      label: "Email",
      placeholder: "Enter email address",
      disabled: true,
    },
    {
      name: "username",
      value: "",
      type: "text",
      label: "Username",
      placeholder: "Enter Username",
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
      name: "firstName",
      value: "",
      type: "text",
      label: "First Name",
      placeholder: "Enter first name",
      required: true,
    },
    {
      name: "lastName",
      value: "",
      type: "text",
      label: "Last Name",
      placeholder: "Enter last name",
      required: true,
    },
  ];

  let resetFormSchema = [
    {
      name: "oldPassword",
      value: "",
      type: "password",
      label: "Old Password",
      placeholder: "Enter old password",
      required: true,
      autoComplete: false,
      validation: true,
    },
    {
      customClass: "col-md-5",
      customElement: <></>,
    },
    {
      name: "password",
      value: "",
      type: "password",
      label: "New Password",
      placeholder: "Enter new password",
      required: true,
      autoComplete: false,
      validation: true,
    },
    {
      customClass: "col-md-12",
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
            Password is more than 8 characters
          </li>
          <li className={passValid["upper"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["upper"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            Upper and lowercase letters
          </li>
          <li className={passValid["number"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["number"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
            At least one number
          </li>
          <li className={passValid["special"] ? "valid" : "not-valid"}>
            <i
              className={
                passValid["special"]
                  ? "ri-checkbox-circle-fill"
                  : "ri-close-circle-fill"
              }
            ></i>
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

  const getUsername = (data, field) => {
    setProfileData(data);

    let { username } = data;
    let error = { ...customError };

    if (field == "username") {
      if (username) {
        if (username.length <= 15) {
          if (/[(@!#\$%\^\&*\)\(+=._-]/?.test(username)) {
            error["username"] = "Use only letters (a-z) and numbers (0-9) only";
          } else {
            setUsernameLoading(true);
            let payload = {
              method: "post",
              url: "/auth/check-profile-username",
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
  };

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

  const getPhoto = (e) => {
    let file = e.target.files[0];
    if (file) {
      // let url = URL.createObjectURL(file);
      if (file?.size > 5242880) {
        sendNotify("error", "Image is too big!, Upload below 5MB file.");
      } else {
        let type = file?.name.substring(file?.name.lastIndexOf(".") + 1);
        var regex = new RegExp("(.*?)(png|jpg|jpeg|svg)$");
        if (regex.test(type)) {
          fileToBase64(file)
            .then((data) => {
              setProfileImg(data);
            })
            .catch((error) => ({ error: JSON.stringify(error) }));
        } else {
          sendNotify(
            "error",
            "Only PNG, JPG, JPEG, or SVG images are supported."
          );
        }
      }
    }
  };

  const saveChanges = () => {
    let valid = profileFormRef.current.validForm();
    if (valid) {
      let data = profileFormRef.current.getPayload();
      delete data["email"];
      setProfileLoading(true);
      let payload = {
        method: "PUT",
        url: "/auth/profile",
        data: { ...data, profileImg },
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            setProfileLoading(false);
            if (!response?.error) {
              getProfileData();
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      if (customError["username"]) {
        sendNotify("error", customError["username"]);
      } else {
        sendNotify("error", "Form validation failed.");
      }
    }
  };

  const changePass = () => {
    let valid = resetFormRef.current.validForm();
    if (valid && Object.keys(passValid).every((k) => passValid[k])) {
      let data = resetFormRef.current.getPayload();
      setResetLoading(true);
      let payload = {
        method: "PUT",
        url: "/auth/change-password",
        data,
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            setResetLoading(false);
            if (!response?.error) {
              setFormData({});
              resetFormRef.current.clearForm();
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Form validation failed.");
    }
  };

  const toggleTwoFactor = (status) => {
    setTwoFactorLoading(true);
    let payload = {
      method: "PUT",
      url: "/auth/update-two-factor",
      data: { status },
    };
    fetchApi(payload, { showNotify: true })
      .then((response) => {
        if (response) {
          setTwoFactorLoading(false);
          if (!response.error && status) {
            setQrCode(response?.data?.qrCode);
            setTwoFactorModal(true);
          }
          if (!status) {
            getProfileData();
            setVerifyModal(false);
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  const verifyTwoFactor = () => {
    if (twoFactorCode) {
      let payload = {
        method: "POST",
        url: "/auth/verify-two-factor?first=true",
        data: { userId: profile?.data?._id, otp: twoFactorCode },
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            if (!response.error) {
              setTwoFactorModal(false);
              getProfileData();
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Please enter the code.");
    }
  };

  const disabledTwoFactor = () => {
    setTwoFactorLoading(true);
    if (twoFactorCode) {
      let payload = {
        method: "POST",
        url: "/auth/verify-two-factor",
        data: { userId: profile?.data?._id, otp: twoFactorCode },
      };
      fetchApi(payload)
        .then(async (response) => {
          if (response) {
            setTwoFactorLoading(false);
            if (!response.error) {
              await toggleTwoFactor(false);
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Please enter the code.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="mb-1">Profile Settings</h1>
          <p>Manage your NorthLark Galactic profile.</p>
        </div>
      </div>
      <div className="page-content">
        <div className="row">
          <div className="custom-form col-md-8">
            <div className="mb-4">
              <label htmlFor="" className="mb-4">
                Profile Picture
              </label>
              <label className="profile-upload" htmlFor="profile">
                {profileImg ? (
                  <img className="profile-image" src={profileImg} alt="" />
                ) : (
                  <h4
                    className="temp-profile"
                    // style={{ backgroundColor: "#000" }}
                  >
                    {profileLetters}
                  </h4>
                )}
                <input
                  type="file"
                  name="profile"
                  id="profile"
                  accept=".png,.jpg,.jpeg,.svg"
                  hidden
                  onChange={getPhoto}
                />
                <div className="hover-icon">
                  <i className="ri-camera-line"></i>
                </div>
              </label>
            </div>
            <FormZ
              ref={profileFormRef}
              formClass="row gy-3 mb-3"
              childClass="col-md-5 mb-0"
              labelClass="mb-1"
              inputClass="w-100"
              formSchema={profileFormSchema}
              formData={profileData}
              onChange={getUsername}
              customValidation={customError}
            />
            <button
              className="primary-btn mt-3"
              onClick={saveChanges}
              disabled={profileLoading}
            >
              {profileLoading && (
                <i className="ri-loader-4-line icon-spin-ani"></i>
              )}
              Save Changes
            </button>
            <hr />
            <h6 className="form-title mb-1">Reset Password</h6>
            <p className="description">Change your password.</p>
            <FormZ
              ref={resetFormRef}
              formClass="row gy-3 mt-2 mb-3"
              childClass="col-md-5 mb-0"
              labelClass="mb-1"
              inputClass="w-100"
              formSchema={resetFormSchema}
              formData={formData}
              onChange={getFormData}
              // customValidation={customError}
            />
            <button
              className="primary-btn mt-3"
              onClick={changePass}
              disabled={resetLoading}
            >
              {resetLoading && (
                <i className="ri-loader-4-line icon-spin-ani"></i>
              )}
              Change Password
            </button>
            <hr />
            <h6 className="form-title mb-1 mt-4">2-Factor Authentication</h6>
            <p className="description">Setup 2FA.</p>
            <button
              className="primary-btn mt-3"
              onClick={
                profile?.data?.twoFactor
                  ? () => setVerifyModal(true)
                  : () => toggleTwoFactor(true)
              }
              disabled={twoFactorLoading}
            >
              {twoFactorLoading && (
                <i className="ri-loader-4-line icon-spin-ani"></i>
              )}
              {profile?.data?.twoFactor ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      </div>
      <ModalZ
        show={twoFactorModal}
        title={
          <>
            <i className="ri-qr-code-line"></i> 2-Factor Authentication
          </>
        }
        onOk={() => setTwoFactorModal(false)}
        onCancel={() => setTwoFactorModal(false)}
        okBtnText="Scanned"
        width={450}
        footer={{ display: false }}
      >
        {currStep == 1 ? (
          <div>
            <p className="mb-3">
              Scan the below QR code in your authenticator app
            </p>
            <div className="text-center py-2">
              <img src={qrCode} alt="" width={170} />
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-3">
              Please enter the code which showed in the authenticator app
            </p>
            <div className="py-5">
              <OtpInput
                value={twoFactorCode}
                onChange={setTwoFactorCode}
                numInputs={6}
                containerStyle="auth-otp-wrapper mb-3"
                renderInput={(props) => (
                  <input {...props} placeholder="0" type="number" />
                )}
              />
            </div>
          </div>
        )}
        <SlidesZ total={2} current={currStep} />
        {currStep == 1 ? (
          <button
            className="primary-btn mx-auto mt-4"
            onClick={() => setCurrStep(2)}
          >
            Next <i className="ri-arrow-right-double-line"></i>
          </button>
        ) : (
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="secondary-btn" onClick={() => setCurrStep(1)}>
              <i className="ri-arrow-left-double-line"></i> Back
            </button>
            <button
              className="primary-btn"
              onClick={() => verifyTwoFactor(true)}
            >
              <i className="ri-checkbox-circle-line"></i> Verify
            </button>
          </div>
        )}
      </ModalZ>
      <ModalZ
        show={verifyModal}
        title={
          <>
            <i className="ri-qr-code-line"></i> 2-Factor Authentication
          </>
        }
        onOk={() => setVerifyModal(false)}
        onCancel={() => setVerifyModal(false)}
        okBtnText="Verify"
        width={450}
        footer={{ display: false }}
      >
        <p className="mb-3">
          Please enter the code which showed in the authenticator app
        </p>
        <div className="py-2">
          <OtpInput
            value={twoFactorCode}
            onChange={setTwoFactorCode}
            numInputs={6}
            containerStyle="auth-otp-wrapper mb-3"
            renderInput={(props) => (
              <input {...props} placeholder="0" type="number" />
            )}
          />
        </div>
        <button className="primary-btn mx-auto" onClick={disabledTwoFactor}>
          <i className="ri-checkbox-circle-line"></i> Verify
        </button>
      </ModalZ>
    </div>
  );
}
