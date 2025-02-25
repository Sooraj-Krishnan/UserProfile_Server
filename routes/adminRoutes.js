const router = require("express").Router();
const {
  adminDashboard,
  createManager,
  editManager,
  viewManagers,
  blockManager,
  deleteManager,
  editAdminProfile,
  viewAllUsers,
} = require("../controllers/adminController");
const { verifyJwt } = require("../helpers/verify_jwt");

router.get("/admin-dashboard", verifyJwt, adminDashboard);
router.put("/edit-admin-profile", verifyJwt, editAdminProfile);
router.get("/view-all-users", verifyJwt, viewAllUsers);
router.post("/create-manager", verifyJwt, createManager);
router.put("/edit-manager/:id", verifyJwt, editManager);
router.get("/view-managers", verifyJwt, viewManagers);
router.put("/block-manager/:id", verifyJwt, blockManager);
router.put("/delete-manager/:id", verifyJwt, deleteManager);

module.exports = router;
