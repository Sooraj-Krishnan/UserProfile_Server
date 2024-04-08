const router = require("express").Router();

const {
  menuView,
  createOrder,
  updateOrderStatus,
  getOrderDetails,
  getOrderDetailsToKitchen,
  getOrderDetailsForManager,
} = require("../controllers/publicController");

const { employeeVerify_Jwt } = require("../helpers/employeeVerifyJWT");
const { verifyJwt } = require("../helpers/verify_jwt");

router.get("/menu-view/:id", menuView);
router.post("/create-order/:id/order", createOrder);
router.put("/update-order-status/:id", updateOrderStatus);
router.get("/get-order-details", employeeVerify_Jwt, getOrderDetails);
router.get(
  "/get-order-details-to-kitchen",
  employeeVerify_Jwt,
  getOrderDetailsToKitchen
);
router.get("/get-order-details-manager", verifyJwt, getOrderDetailsForManager);
module.exports = router;
