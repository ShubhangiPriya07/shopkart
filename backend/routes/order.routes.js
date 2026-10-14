const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} = require("../controllers/order.controller");

const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-payment-order", protect, createPaymentOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

module.exports = router;