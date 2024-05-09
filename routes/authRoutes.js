const router = require("express").Router();
const {
  login,
  employeeLogin,
  refreshToken,
  logout,
  forgotPassword,
  updateNewPassword,
  signup,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/employee-login", employeeLogin);
router.post("/refresh_token", refreshToken);
router.post("/logout", logout);
router.post("/forgot_password", forgotPassword);
router.post("/update_new_password", updateNewPassword);
router.post("/signup", signup);

module.exports = router;
