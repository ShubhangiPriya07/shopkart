const express = require("express");
const protect = require("../middlewares/auth.middleware");

const {
  createProduct,
  getProducts,
  getProductById,
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/", protect, createProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProductById);

module.exports = router;