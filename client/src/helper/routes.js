// Auth
import Login from "../pages/auth/login";
import Signup from "../pages/auth/signup";
import ResetPassword from "../pages/auth/reset-password";

//Private
import Upload from "../pages/upload";
import VerificationReport from "../pages/verification-report";
import Tasks from "../pages/tasks";
import AiTasks from "../pages/ai-tasks";
import ProfileSettings from "../pages/profile-settings";
import UserManagement from "../pages/user-management";
import UserCrud from "../pages/user-management/crud";
import AccountSettings from "../pages/account-settings";
import AnalystTasks from "../pages/analyst-tasks";
import Task from "../pages/task";
import AdminTasks from "../pages/admin-tasks";
import Notifications from "../pages/notifications";
import WorldCheck from "../pages/world-check";
import FraudAssessment from "../pages/fraud-assessment";
import FinalReport from "../pages/final-report";
import WrenConnect from "../pages/wren-connect";
import NotFound from "../pages/not-found";

const routes = [
  {
    name: "Login",
    path: "/",
    component: <Login />,
    type: "public",
  },
  {
    name: "Login",
    path: "/login",
    component: <Login />,
    type: "public",
  },
  {
    name: "Signup",
    path: "/signup/:token",
    component: <Signup />,
    type: "public",
  },
  {
    name: "Reset Password",
    path: "/reset-password/:token",
    component: <ResetPassword />,
    type: "public",
  },
  {
    name: "Upload",
    path: "upload",
    component: <Upload />,
    icon: "fa-home",
    type: "private",
    permissions: ["super-admin", "end-user"],
    showInMenu: false,
  },
  {
    path: "verification-report/:id",
    component: <VerificationReport />,
    type: "private",
    permissions: ["super-admin", "client"],
  },
  {
    name: "Tasks",
    path: "tasks",
    component: <Tasks />,
    icon: "ri-stack-line",
    type: "private",
    permissions: ["super-admin", "client"],
    showInMenu: true,
  },
  {
    name: "AI Tasks",
    path: "ai-tasks",
    component: <AiTasks />,
    icon: "ri-sparkling-2-fill",
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
    showInMenu: true,
  },
  {
    name: "Analyst Tasks",
    path: "analyst-tasks",
    component: <AnalystTasks />,
    icon: "ri-menu-search-line",
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
    showInMenu: true,
  },
  {
    path: "task/:id",
    component: <Task />,
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
    showInMenu: false,
  },
  {
    name: "Admin Tasks",
    path: "admin-tasks",
    component: <AdminTasks />,
    icon: "ri-shield-star-line",
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
    showInMenu: true,
  },
  {
    name: "Profile Settings",
    path: "profile-settings",
    component: <ProfileSettings />,
    icon: "ri-user-line",
    type: "private",
    permissions: ["super-admin", "admin", "client"],
    showInMenu: true,
  },
  {
    name: "User Management",
    path: "user-management",
    component: <UserManagement />,
    icon: "ri-settings-3-line",
    type: "private",
    permissions: ["super-admin", "admin", "client"],
    showInMenu: true,
  },
  {
    name: "Add User",
    path: "add-user",
    component: <UserCrud />,
    type: "private",
    permissions: ["super-admin", "admin", "client"],
  },
  {
    name: "Edit User",
    path: "edit-user/:id",
    component: <UserCrud />,
    type: "private",
    permissions: ["super-admin", "admin", "client"],
  },
  {
    name: "Account Settings",
    path: "account-settings",
    component: <AccountSettings />,
    icon: "ri-tools-line",
    type: "private",
    permissions: ["super-admin", "client"],
    showInMenu: true,
  },
  {
    name: "WrenConnect",
    path: "wren-connect",
    component: <WrenConnect />,
    icon: "ri-message-2-line",
    type: "private",
    permissions: ["super-admin", "client"],
    showInMenu: true,
  },
  {
    name: "Notifications",
    path: "notifications",
    component: <Notifications />,
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
  },
  {
    name: "World Check",
    path: "world-check/:id",
    component: <WorldCheck />,
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
  },
  {
    name: "Fraud Assessment",
    path: "fraud-assessment/:id",
    component: <FraudAssessment />,
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
  },
  {
    name: "FinalReport",
    path: "final-report/:id",
    component: <FinalReport />,
    type: "private",
    permissions: ["super-admin", "admin", "analyst"],
  },
  // {
  //   name: "Error 404",
  //   path: "*",
  //   icon: "",
  //   component: <NotFound />,
  //   type: "private",
  //   permissions: [],
  //   showInMenu: false,
  // },
];

export default routes;
