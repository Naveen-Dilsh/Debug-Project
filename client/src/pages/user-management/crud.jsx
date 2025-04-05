import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Select } from "antd";

import { fetchApi, sendNotify } from "../../helper";

import FormZ from "../../components/FormZ";
import ModalZ from "../../components/ModalZ";

export default function Crud() {
  let { id } = useParams();

  const navigate = useNavigate();

  let { userDetails } = useSelector((state) => state.auth);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [accessModal, setAccessModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const formRef = useRef();

  useEffect(() => {
    if (id) {
      setEditMode(true);
      getUser();
    }
  }, [id]);

  let formSchema = [
    {
      name: "email",
      value: editMode ? "johndoe@company.com" : "",
      type: "email",
      label: "Email",
      placeholder: "Enter email address",
      customClass: "col-md-10",
      required: true,
      disabled: editMode,
    },
    {
      name: "firstName",
      value: "John",
      type: "text",
      label: "First Name",
      placeholder: "Enter first name",
      required: true,
    },
    {
      name: "lastName",
      value: "Doe",
      type: "text",
      label: "Last Name",
      placeholder: "Enter last name",
      required: true,
    },
  ];

  const getUser = () => {
    let payload = {
      method: "GET",
      url: `/auth/user?id=${id}`,
    };
    fetchApi(payload)
      .then((response) => {
        if (response) {
          setLoading(false);
          if (!response.error) {
            setFormData(response?.data);
            setSelectedRole(response?.data?.role);
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  function handleRole(value) {
    let data = formRef.current.getPayload();
    setFormData(data);
    setSelectedRole(value);
  }

  const addEditUser = async () => {
    let valid = formRef.current.validForm();
    if (valid) {
      setLoading(true);
      let data = formRef.current.getPayload();
      setFormData(data);
      if (editMode) {
        delete data["email"];
      } else {
        data["role"] = selectedRole !== "" ? selectedRole : "end-user";
      }
      await userAction(data);
    } else {
      sendNotify("error", "Some fields are missing!");
    }
  };

  const changeAccess = async () => {
    await userAction({ role: selectedRole });
  };

  const deleteUser = async () => {
    await userAction({ status: "D" });
    setDeleteModal(false);
    navigate("/app/user-management");
  };

  const userAction = async (data) => {
    data["id"] = id;
    let payload = {
      method: editMode ? "PUT" : "POST",
      url: "/auth/user",
      data,
    };
    await fetchApi(payload, { showNotify: true })
      .then((response) => {
        if (response) {
          setLoading(false);
          if (!response.error) {
            if (editMode) {
              getUser();
            } else {
              formRef.current.clearForm();
              setFormData({});
            }
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  const approveReset = () => {
    let payload = {
      method: "GET",
      url: `/auth/user/approve-reset/${id}`,
    };
    fetchApi(payload, { showNotify: true })
      .then((response) => {
        if (response) {
          setLoading(false);
          if (!response.error) {
            setResetModal(true);
            getUser();
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="mb-1">{editMode ? "Edit" : "Add"} User</h1>
          <p className="mb-0">
            {editMode ? "Edit" : "Add"} a new user profile.
          </p>
        </div>
      </div>
      <div className="page-content">
        <div className="row">
          <div className="custom-form col-md-8">
            <FormZ
              ref={formRef}
              formSchema={formSchema}
              formData={formData}
              formClass="row gy-4 mb-4"
              childClass="col-md-5 mb-0"
              labelClass="mb-1"
              inputClass="w-100"
            />
            {editMode && (
              <div className="d-flex justify-content-between mt-3">
                <div>
                  {formData?.status == "A" && (
                    <button
                      className="danger-btn"
                      onClick={() => userAction({ status: "I" })}
                    >
                      Revoke Access
                    </button>
                  )}
                  {formData?.status == "I" && (
                    <button
                      className="success-btn"
                      onClick={() => userAction({ status: "A" })}
                    >
                      Grant Access
                    </button>
                  )}
                </div>

                <div className="d-flex gap-3">
                  <Link to={"/app/user-management"} className="secondary-btn">
                    Cancel
                  </Link>
                  <button
                    className="primary-btn"
                    onClick={addEditUser}
                    disabled={loading}
                  >
                    {loading && (
                      <i className="ri-loader-4-line icon-spin-ani"></i>
                    )}
                    {editMode ? "Save changes" : "Add User"}
                  </button>
                </div>
              </div>
            )}
            {userDetails?.role == "admin" && (
              <div className="row">
                <div className="mt-4 mb-3">
                  <h6 className="form-title mb-1">Access Type</h6>
                  <p className="description mb-4">
                    Define user roles by choosing between client, analyst and
                    admin access levels.
                  </p>
                  <div className="col-md-5 pe-3">
                    <label htmlFor="">User role</label>
                    <Select
                      value={formData["role"]}
                      className="custom-select w-100"
                      placeholder="Select user role"
                      onChange={handleRole}
                      options={[
                        {
                          value: "admin",
                          label: "Admin",
                        },
                        {
                          value: "analyst",
                          label: "Analyst",
                        },
                        {
                          value: "client",
                          label: "Client",
                        },
                      ]}
                    />
                    {editMode && (
                      <button
                        className="primary-btn mt-3"
                        onClick={() => setAccessModal(true)}
                      >
                        Change Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {!editMode && (
              <div>
                <hr />
                <div className="d-flex justify-content-end gap-3 mt-4">
                  <Link to={"/app/user-management"} className="secondary-btn">
                    Cancel
                  </Link>
                  <button
                    className="primary-btn"
                    onClick={addEditUser}
                    disabled={loading}
                  >
                    {loading && (
                      <i className="ri-loader-4-line icon-spin-ani"></i>
                    )}
                    {editMode ? "Save changes" : "Add User"}
                  </button>
                </div>
              </div>
            )}
            {editMode && (
              <div>
                <hr />
                <div className="my-4">
                  <h6 className="form-title mb-1">Reset Password</h6>
                  <p className="description mb-4">
                    If a user has forgotten their password or needs a reset due
                    to security protocols.
                  </p>
                  <button
                    className="primary-btn"
                    disabled={!formData?.resetReq}
                    onClick={approveReset}
                  >
                    Reset password
                  </button>
                </div>
              </div>
            )}
            {editMode && (
              <div>
                <hr />
                <div className="my-4">
                  <h6 className="form-title mb-1">Delete User</h6>
                  <p className="description mb-4">
                    Remove user and all their related data from the system.
                  </p>
                  <button
                    className="danger-btn"
                    onClick={() => setDeleteModal(true)}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ModalZ
        show={resetModal}
        title={
          <>
            <i className="ri-checkbox-circle-fill color-green"></i> Password
            Reset Successful
          </>
        }
        onOk={() => setResetModal(false)}
        onCancel={() => setResetModal(false)}
      >
        <p>
          Your password has been updated successfully. You can now log in with
          your new password.
        </p>
      </ModalZ>
      <ModalZ
        show={accessModal}
        title={
          <>
            <i className="ri-checkbox-circle-fill color-green"></i> Confirm role
            change
          </>
        }
        onOk={changeAccess}
        onCancel={() => setAccessModal(false)}
      >
        <p>Are you sure you want to change this user role?</p>
      </ModalZ>
      <ModalZ
        show={deleteModal}
        title={
          <>
            <i className="ri-close-circle-fill color-red"></i> Delete User
          </>
        }
        onOk={deleteUser}
        okBtnProps={{ text: "Delete User", className: "danger-btn" }}
        onCancel={() => setDeleteModal(false)}
      >
        <p>
          Are you sure you want to delete this user? All associated data will be
          permanently removed.
        </p>
      </ModalZ>
    </div>
  );
}
