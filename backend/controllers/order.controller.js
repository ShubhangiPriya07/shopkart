const crypto = require("crypto");
const mongoose = require("mongoose");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const razorpay = require("../config/razorpay");

// POST /orders/create-payment-order
const createPaymentOrder = async (req, res) => {
  let shopKartOrder;

  try {
    const { shippingAddress } = req.body;

    // Validate shipping address.
    const requiredFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "pincode",
    ];

    if (
      !shippingAddress ||
      requiredFields.some(
        (field) =>
          typeof shippingAddress[field] !== "string" ||
          !shippingAddress[field].trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All shipping address fields are required",
      });
    }

    const address = {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      addressLine1: shippingAddress.addressLine1.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim(),
    };

    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian phone number",
      });
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain 6 digits",
      });
    }

    // Load the authenticated customer's cart and current products.
    const customer = await Customer.findById(req.user._id).populate(
      "cart.product"
    );

    if (!customer || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of customer.cart) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      if (
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Snapshot current product details into the order.
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });

      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order total",
      });
    }

    // Save the ShopKart order before creating the payment order.
    shopKartOrder = await Order.create({
      user: customer._id,
      items: orderItems,
      shippingAddress: address,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // Razorpay expects INR amounts in paise.
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: shopKartOrder._id.toString(),
    });

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    // Do not leave an unusable pending order if payment-order
    // creation fails.
    if (shopKartOrder && !shopKartOrder.razorpayOrderId) {
      try {
        await Order.findByIdAndDelete(shopKartOrder._id);
      } catch (cleanupError) {
        console.error(
          "Pending order cleanup failed:",
          cleanupError.message
        );
      }
    }

    console.error("Create payment order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

// POST /orders/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(shopKartOrderId) ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details",
      });
    }

    // Only allow the owner to verify their order.
    const order = await Order.findOne({
      _id: shopKartOrderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Make repeat verification requests safe.
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match",
      });
    }

    const signaturePayload =
      `${order.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest("hex");

    // Compare signatures without a length-related exception.
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const signatureIsValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Confirm the order only after signature verification.
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;

    await order.save();

    // Clear the authenticated customer's cart after verification.
    const customer = await Customer.findById(req.user._id);

    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

// GET /orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load orders",
    });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Query by both order ID and owner.
    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load order",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};