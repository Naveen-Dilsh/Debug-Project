import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Table } from "antd";

import FormZ from "../components/FormZ";
import ImageUploadZ from "../components/ImageUploadZ";

import { Each, copyThat, sendNotify, fetchApi } from "../helper";

import {
  themeColors,
  toggleThemeColor,
} from "../store/theme-color/themeColorSlice";
import { fetchProfile } from "../store/profile/profileSlice";

export default function AccountSettings() {
  const dispatch = useDispatch();

  const { userDetails } = useSelector((state) => state.auth);
  const profile = useSelector((state) => state.profile);
  const { themeColor } = useSelector((state) => state.themeColor);

  const companyFormRef = useRef();

  const [formData, setFormData] = useState([]);

  let companyFormSchema = [
    {
      name: "companyName",
      value: "",
      type: "text",
      label: "Company Name",
      placeholder: "Enter Company name",
      required: true,
    },
  ];

  const baseUrl = "northlark.wren/";

  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [slugUrl, setSlugUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userDetails) {
      let role = userDetails?.role;
      if (role == "super-admin" || role == "admin") {
        setIsAdmin(true);
      }
    }
    if (profile) {
      setLogo(profile?.data?.logo);
      setFavicon(profile?.data?.favicon);
      setFormData({ companyName: profile?.data?.companyName });
      setSlugUrl(profile?.data?.slug);
    }
  }, [userDetails, profile]);

  useEffect(() => {
    let index = themeColors.findIndex((tc) => tc == themeColor);
    setSelectedColor(index);
  }, [themeColor]);

  const changeThemeColor = (index) => {
    setSelectedColor(index);
    dispatch(toggleThemeColor(index));
  };

  const copyUrl = () => {
    copyThat("https://" + baseUrl + slugUrl);
    setIsCopied(true);
  };

  const onChangeHandler = (setIdentifierState, event) => {
    setIdentifierState(event.target.value);
  };

  const getOnUpdate = async (value) => {
    setFormData(value);
  };

  const saveChange = () => {
    let valid = companyFormRef.current.validForm();
    if (valid) {
      let company = companyFormRef.current.getPayload();
      setLoading(true);
      let data = {
        logo,
        favicon,
        companyName: company?.companyName,
        slug: slugUrl,
        theme: selectedColor,
      };
      let payload = {
        method: "PUT",
        url: "/auth/profile",
        data,
      };
      fetchApi(payload, { showNotify: true })
        .then((response) => {
          if (response) {
            setLoading(false);
            if (!response?.error) {
              dispatch(fetchProfile());
            }
          }
        })
        .catch((error) => ({ error: JSON.stringify(error) }));
    } else {
      sendNotify("error", "Company name is required");
    }
  };

  return (
    <div>
      <div className="page-header w-100">
        <div>
          <h1 className="mb-1">Account</h1>
          <p>Manage your NorthLark Galactic account.</p>
        </div>
      </div>
      <div className="page-content">
        <div className="row custom-form">
          <div className="col-md-8">
            <div className="mb-4">
              <div className="mb-3">
                <label htmlFor="" className="req">
                  Horizontal Logo
                </label>
                <ImageUploadZ
                  image={logo}
                  onImageUpload={(image) => setLogo(image)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="" className="req">
                  Favicon
                </label>
                <ImageUploadZ
                  image={favicon}
                  onImageUpload={(image) => setFavicon(image)}
                />
              </div>
              <FormZ
                formClass="mb-4"
                childClass="col-md-8"
                ref={companyFormRef}
                onChange={getOnUpdate}
                formData={formData}
                formSchema={companyFormSchema}
                labelClass="mb-1"
                inputClass="w-100"
              />
              <div className="col-md-8">
                <label htmlFor="" className="req">
                  Slug
                </label>
                <div className="input-after-button">
                  <div
                    className="input-placeholder w-100"
                    data-placeholder={baseUrl}
                  >
                    <input
                      type="text"
                      name="slug"
                      placeholder="Enter slug"
                      value={slugUrl || ""}
                      onChange={(e) => setSlugUrl(e.target.value)}
                    />
                  </div>
                  <button className="primary-btn" onClick={copyUrl}>
                    {isCopied ? (
                      <>
                        <i className="ri-file-copy-fill"></i> Copied&nbsp;
                      </>
                    ) : (
                      <>
                        <i className="ri-file-copy-line"></i> Copy&nbsp;URL
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <hr />
            <div className="mt-4">
              <h6 className="form-title mb-3">System Theme</h6>
              <div className="system-theme">
                <Each
                  array={themeColors}
                  render={(item, index) => (
                    <span
                      className={`${item?.color} ${
                        index == selectedColor ? "selected" : ""
                      }`}
                      onClick={() => changeThemeColor(index)}
                    ></span>
                  )}
                />
              </div>
            </div>

            <button
              className="primary-btn mt-4"
              onClick={saveChange}
              disabled={loading}
            >
              {loading && <i className="ri-loader-4-line icon-spin-ani"></i>}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
