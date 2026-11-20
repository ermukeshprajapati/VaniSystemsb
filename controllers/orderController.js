// // ==============================
// // controllers/orderController.js
// // ==============================
// const Order = require('../models/Order');

// // ======================================================
// // ORDER ID GENERATOR
// // ======================================================
// const generateOrderId = () => {
//   const timestamp = Date.now().toString().slice(-8);
//   const random = Math.floor(1000 + Math.random() * 9000);
//   return `ORD-${timestamp}-${random}`;
// };

// // ======================================================
// // INVOICE NUMBER GENERATOR
// // ======================================================
// const generateInvoiceNumber = () => {
//   const timestamp = Date.now().toString().slice(-8);
//   const random = Math.floor(100 + Math.random() * 900);
//   return `INV-${timestamp}-${random}`;
// };

// // ======================================================
// // TRACKING NUMBER GENERATOR
// // ======================================================
// const generateTrackingNumber = () => {
//   const timestamp = Date.now().toString().slice(-8);
//   const random = Math.floor(1000 + Math.random() * 9000);
//   return `TRK-${timestamp}-${random}`;
// };

// // ======================================================
// // CREATE AND SEND NOTIFICATION
// // ======================================================
// const createAndSendNotification = async (app, data) => {
//   try {
//     if (!app) {
//       return;
//     }
//     const notificationController = require('./notificationController');
//     if (
//       notificationController &&
//       typeof notificationController.createNotification === 'function'
//     ) {
//       await notificationController.createNotification({
//         body: data
//       });
//     }
//   } catch (error) {
//     console.error('Notification error:', error.message);
//   }
// };

// // ==============================
// // CREATE ORDER
// // ==============================
// exports.createOrder = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         error: 'Authentication required'
//       });
//     }

//     const generatedId = generateOrderId();

//     const targetEmail =
//       req.user?.email ||
//       req.body.customerEmail ||
//       'user@example.com';

//     const targetName =
//       req.body.customerName ||
//       req.user?.name ||
//       'Customer';

//     const targetPhone =
//       req.body.customerPhone ||
//       req.user?.phone ||
//       '';

//     const orderData = {
//       orderId: generatedId,
//       invoiceNumber: generateInvoiceNumber(),
//       trackingNumber: generateTrackingNumber(),
//       userId: req.user._id || req.user.id,
//       customerEmail: targetEmail,
//       customerName: targetName,
//       customerPhone: targetPhone,
//       customerAddress: req.body.customerAddress || '',
//       customerCity: req.body.customerCity || '',
//       customerPinCode: req.body.customerPinCode || '',
//       items: Array.isArray(req.body.items) ? req.body.items : [],
//       totalItems: Number(req.body.totalItems) || 0,
//       subtotal: Number(req.body.subtotal) || 0,
//       shippingCharge: 0,
//       tax: 0,
//       discount: Number(req.body.discount) || 0,
//       grandTotal: Number(req.body.grandTotal) || 0,
//       paymentMethod: req.body.paymentMethod || 'Cash On Delivery',
//       paymentStatus:
//         req.body.paymentMethod === 'Cash On Delivery' ? 'Pending' : 'Paid',
//       status: 'Pending',
//       timeline: [
//         {
//           status: 'Order Placed',
//           date: new Date().toLocaleString(),
//           remarks: 'Order received successfully',
//           adminName: 'System'
//         }
//       ],
//       tracking: {
//         currentLocation: 'Processing Center',
//         estimatedDelivery: new Date(
//           Date.now() + 7 * 24 * 60 * 60 * 1000
//         ).toLocaleDateString(),
//         trackingHistory: [
//           {
//             status: 'Order Placed',
//             location: 'Processing Center',
//             date: new Date().toLocaleString(),
//             time: new Date().toLocaleTimeString()
//           }
//         ]
//       }
//     };

//     const order = await Order.create(orderData);

//     const io = req.app.get('io');
//     if (io) {
//       io.to('admin-room').emit('new-order', order);
//     }

//     await createAndSendNotification(req.app, {
//       userId: req.user._id || req.user.id,
//       userEmail: targetEmail,
//       title: '📦 Order Placed Successfully!',
//       message: `Thank you for your purchase. Your order ID is ${generatedId}.`,
//       type: 'order'
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       data: order
//     });
//   } catch (error) {
//     console.error('Create order error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Server error'
//     });
//   }
// };

// // ==============================
// // GET ALL ORDERS
// // ==============================
// exports.getAllOrders = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         error: 'Authentication required'
//       });
//     }

//     const isAdmin =
//       req.user.role === 'admin' || req.user.role === 'Admin';

//     let orders;

//     if (isAdmin) {
//       orders = await Order.find({}).sort({ createdAt: -1 });
//     } else {
//       orders = await Order.find({
//         userId: req.user._id || req.user.id
//       }).sort({ createdAt: -1 });
//     }

//     return res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: {
//         orders
//       }
//     });
//   } catch (error) {
//     console.error('Get all orders error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to fetch orders'
//     });
//   }
// };

// // ==============================
// // GET ORDER BY ID
// // ==============================
// exports.getOrderById = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         error: 'Authentication required'
//       });
//     }

//     const order = await Order.findOne({ orderId: req.params.id });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         error: 'Order not found'
//       });
//     }

//     const isAdmin =
//       req.user.role === 'admin' || req.user.role === 'Admin';

//     const orderUserId = order.userId ? order.userId.toString() : '';
//     const currentUserId = (req.user._id || req.user.id).toString();

//     if (!isAdmin && orderUserId !== currentUserId) {
//       return res.status(403).json({
//         success: false,
//         error: 'You are not authorized to view this order'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: order
//     });
//   } catch (error) {
//     console.error('Get order by ID error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to fetch order'
//     });
//   }
// };

// // ==============================
// // UPDATE ORDER STATUS
// // ==============================
// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;

//     if (!status) {
//       return res.status(400).json({
//         success: false,
//         error: 'Order status is required'
//       });
//     }

//     // Normalize status (case-insensitive)
//     const normalizedStatus = String(status).trim().toLowerCase();

//     const statusMap = {
//       'pending': 'Pending',
//       'confirmed': 'Confirmed',
//       'processing': 'Processing',
//       'shipped': 'Shipped',
//       'out for delivery': 'Out for Delivery',
//       'outfordelivery': 'Out for Delivery',
//       'delivered': 'Delivered',
//       'cancelled': 'Cancelled',
//       'canceled': 'Cancelled',
//       'returned': 'Returned'
//     };

//     const finalStatus = statusMap[normalizedStatus] || status.trim();

//     const allowedStatuses = [
//       'Pending',
//       'Confirmed',
//       'Processing',
//       'Shipped',
//       'Out for Delivery',
//       'Delivered',
//       'Cancelled',
//       'Returned'
//     ];

//     if (!allowedStatuses.includes(finalStatus)) {
//       return res.status(400).json({
//         success: false,
//         error: `Invalid order status. Allowed statuses: ${allowedStatuses.join(', ')}`
//       });
//     }

//     const order = await Order.findOne({ orderId: req.params.id });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         error: 'Order not found'
//       });
//     }

//     order.status = finalStatus;

//     if (!Array.isArray(order.timeline)) {
//       order.timeline = [];
//     }

//     order.timeline.push({
//       status: finalStatus,
//       date: new Date().toLocaleString(),
//       remarks: remarks || `Order status changed to ${finalStatus}`,
//       adminName: req.user?.name || req.user?.email || 'Admin'
//     });

//     if (!order.tracking) {
//       order.tracking = {
//         currentLocation: 'Processing Center',
//         estimatedDelivery: new Date(
//           Date.now() + 7 * 24 * 60 * 60 * 1000
//         ).toLocaleDateString(),
//         trackingHistory: []
//       };
//     }

//     if (!Array.isArray(order.tracking.trackingHistory)) {
//       order.tracking.trackingHistory = [];
//     }

//     order.tracking.trackingHistory.push({
//       status: finalStatus,
//       location: order.tracking.currentLocation || 'Processing Center',
//       date: new Date().toLocaleString(),
//       time: new Date().toLocaleTimeString()
//     });

//     await order.save();

//     const io = req.app.get('io');
//     if (io) {
//       io.to(`user-${order.userId}`).emit('order-status-updated', order);
//       io.to('admin-room').emit('order-status-updated', order);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Order status updated successfully',
//       data: order
//     });
//   } catch (error) {
//     console.error('Update order status error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to update order status'
//     });
//   }
// };

// // ==============================
// // CANCEL ORDER
// // ==============================
// exports.cancelOrder = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         error: 'Authentication required'
//       });
//     }

//     const order = await Order.findOne({ orderId: req.params.id });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         error: 'Order not found'
//       });
//     }

//     const isAdmin =
//       req.user.role === 'admin' || req.user.role === 'Admin';

//     const orderUserId = order.userId ? order.userId.toString() : '';
//     const currentUserId = (req.user._id || req.user.id).toString();

//     if (!isAdmin && orderUserId !== currentUserId) {
//       return res.status(403).json({
//         success: false,
//         error: 'You are not authorized to cancel this order'
//       });
//     }

//     if (order.status === 'Delivered') {
//       return res.status(400).json({
//         success: false,
//         error: 'Delivered order cannot be cancelled'
//       });
//     }

//     if (order.status === 'Cancelled') {
//       return res.status(400).json({
//         success: false,
//         error: 'Order is already cancelled'
//       });
//     }

//     const reason = req.body?.reason || 'Order cancelled by customer';

//     order.status = 'Cancelled';

//     if (!Array.isArray(order.timeline)) {
//       order.timeline = [];
//     }

//     order.timeline.push({
//       status: 'Cancelled',
//       date: new Date().toLocaleString(),
//       remarks: reason,
//       adminName: isAdmin
//         ? req.user?.name || req.user?.email || 'Admin'
//         : 'Customer'
//     });

//     if (order.tracking) {
//       if (!Array.isArray(order.tracking.trackingHistory)) {
//         order.tracking.trackingHistory = [];
//       }

//       order.tracking.trackingHistory.push({
//         status: 'Cancelled',
//         location: order.tracking.currentLocation || 'Processing Center',
//         date: new Date().toLocaleString(),
//         time: new Date().toLocaleTimeString()
//       });
//     }

//     await order.save();

//     const io = req.app.get('io');
//     if (io) {
//       io.to(`user-${order.userId}`).emit('order-cancelled', order);
//       io.to('admin-room').emit('order-cancelled', order);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Order cancelled successfully',
//       data: order
//     });
//   } catch (error) {
//     console.error('Cancel order error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to cancel order'
//     });
//   }
// };

// // ==============================
// // RETURN ORDER
// // ==============================
// exports.returnOrder = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         error: 'Authentication required'
//       });
//     }

//     const order = await Order.findOne({ orderId: req.params.id });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         error: 'Order not found'
//       });
//     }

//     const isAdmin =
//       req.user.role === 'admin' || req.user.role === 'Admin';

//     const orderUserId = order.userId ? order.userId.toString() : '';
//     const currentUserId = (req.user._id || req.user.id).toString();

//     if (!isAdmin && orderUserId !== currentUserId) {
//       return res.status(403).json({
//         success: false,
//         error: 'You are not authorized to return this order'
//       });
//     }

//     if (order.status !== 'Delivered') {
//       return res.status(400).json({
//         success: false,
//         error: 'Only delivered orders can be returned'
//       });
//     }

//     const reason = req.body?.reason || 'Return requested by customer';

//     order.status = 'Returned';

//     if (!Array.isArray(order.timeline)) {
//       order.timeline = [];
//     }

//     order.timeline.push({
//       status: 'Returned',
//       date: new Date().toLocaleString(),
//       remarks: reason,
//       adminName: isAdmin
//         ? req.user?.name || req.user?.email || 'Admin'
//         : 'Customer'
//     });

//     if (order.tracking) {
//       if (!Array.isArray(order.tracking.trackingHistory)) {
//         order.tracking.trackingHistory = [];
//       }

//       order.tracking.trackingHistory.push({
//         status: 'Returned',
//         location: order.tracking.currentLocation || 'Processing Center',
//         date: new Date().toLocaleString(),
//         time: new Date().toLocaleTimeString()
//       });
//     }

//     await order.save();

//     const io = req.app.get('io');
//     if (io) {
//       io.to(`user-${order.userId}`).emit('order-returned', order);
//       io.to('admin-room').emit('order-returned', order);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Order return processed successfully',
//       data: order
//     });
//   } catch (error) {
//     console.error('Return order error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to return order'
//     });
//   }
// };

// // ==============================
// // GET ORDER STATS
// // ==============================
// exports.getOrderStats = async (req, res) => {
//   try {
//     const totalOrders = await Order.countDocuments();
//     const pendingOrders = await Order.countDocuments({ status: 'Pending' });
//     const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
//     const processingOrders = await Order.countDocuments({ status: 'Processing' });
//     const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
//     const outForDeliveryOrders = await Order.countDocuments({
//       status: 'Out for Delivery'
//     });
//     const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
//     const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
//     const returnedOrders = await Order.countDocuments({ status: 'Returned' });

//     const salesResult = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: 'Cancelled' }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalSales: {
//             $sum: { $ifNull: ['$grandTotal', 0] }
//           }
//         }
//       }
//     ]);

//     const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalOrders,
//         pendingOrders,
//         confirmedOrders,
//         processingOrders,
//         shippedOrders,
//         outForDeliveryOrders,
//         deliveredOrders,
//         cancelledOrders,
//         returnedOrders,
//         totalSales
//       }
//     });
//   } catch (error) {
//     console.error('Get order stats error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'Failed to fetch order statistics'
//     });
//   }
// };

// // ==============================
// // EXPORTS
// // ==============================
// module.exports = {
//   createOrder: exports.createOrder,
//   getAllOrders: exports.getAllOrders,
//   getOrderById: exports.getOrderById,
//   updateOrderStatus: exports.updateOrderStatus,
//   cancelOrder: exports.cancelOrder,
//   returnOrder: exports.returnOrder,
//   getOrderStats: exports.getOrderStats
// };


// ==========================================
// controllers/orderController.js
// ==========================================

const Order = require("../models/Order");
const nodemailer = require("nodemailer");

// ==========================================
// GENERATE ORDER ID
// ==========================================

const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ==========================================
// GENERATE INVOICE NUMBER
// ==========================================

const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ==========================================
// GENERATE TRACKING NUMBER
// ==========================================

const generateTrackingNumber = () => {
  return `TRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ==========================================
// HTML ESCAPE
// ==========================================

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ==========================================
// EMAIL TRANSPORTER
// SAME SMTP METHOD AS CANDIDATE CONTROLLER
// ==========================================

const createEmailTransporter = async () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = Number(process.env.EMAIL_PORT || 587);

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing.");
  }

  if (![465, 587].includes(emailPort)) {
    throw new Error("Invalid EMAIL_PORT. Use 465 or 587.");
  }

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  await transporter.verify();

  return {
    transporter,
    emailUser,
  };
};

// ==========================================
// CREATE NOTIFICATION
// ==========================================

const createAndSendNotification = async (app, data) => {
  try {
    const notificationController = require("./notificationController");

    if (
      typeof notificationController.createNotification === "function"
    ) {
      await notificationController.createNotification(app, data);
    }
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

// ==========================================
// ORDER PROGRESS STEPS
// ==========================================

const ORDER_PROGRESS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Ready To Ship",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
];

// ==========================================
// NORMALIZE ORDER STATUS
// ==========================================

const normalizeOrderStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    packed: "Packed",
    "ready to ship": "Ready To Ship",
    shipped: "Shipped",
    "out for delivery": "Out for Delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    returned: "Returned",
    refunded: "Refunded",
  };

  return statusMap[value] || null;
};

// ==========================================
// GET ORDER PROGRESS HTML
// ==========================================

const getOrderProgressHtml = (currentStatus) => {
  const current = normalizeOrderStatus(currentStatus) || "Pending";

  const currentIndex = ORDER_PROGRESS_STEPS.indexOf(current);

  const progress = currentIndex >= 0
    ? ((currentIndex + 1) / ORDER_PROGRESS_STEPS.length) * 100
    : 0;

  const stepsHtml = ORDER_PROGRESS_STEPS.map((step, index) => {
    const completed = index <= currentIndex;

    return `
      <td style="text-align:center;width:${100 / ORDER_PROGRESS_STEPS.length}%;">
        <div style="
          width:18px;
          height:18px;
          margin:0 auto;
          border-radius:50%;
          background:${completed ? "#16a34a" : "#d1d5db"};
          border:2px solid ${completed ? "#16a34a" : "#d1d5db"};
        "></div>

        <div style="
          font-size:10px;
          margin-top:7px;
          color:${completed ? "#166534" : "#6b7280"};
          font-weight:${completed ? "bold" : "normal"};
        ">
          ${escapeHtml(step)}
        </div>
      </td>
    `;
  }).join("");

  return `
    <div style="margin:25px 0;">
      <h3 style="color:#111827;">Order Progress</h3>

      <div style="
        height:8px;
        background:#e5e7eb;
        border-radius:10px;
        overflow:hidden;
        margin-bottom:15px;
      ">
        <div style="
          width:${progress}%;
          height:8px;
          background:#16a34a;
          border-radius:10px;
        "></div>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>${stepsHtml}</tr>
      </table>
    </div>
  `;
};

// ==========================================
// SEND ORDER EMAIL
// ==========================================

const sendOrderEmail = async (order, emailType = "updated") => {
  try {
    const customerEmail = order.customerEmail;

    if (!customerEmail) {
      console.warn("Order email skipped: Customer email is missing.");
      return {
        success: false,
        message: "Customer email is missing.",
      };
    }

    const { transporter, emailUser } =
      await createEmailTransporter();

    const customerName = escapeHtml(
      order.customerName || "Customer"
    );

    const orderId = escapeHtml(order.orderId || "");
    const invoiceNumber = escapeHtml(order.invoiceNumber || "");
    const trackingNumber = escapeHtml(order.trackingNumber || "");

    const status = escapeHtml(order.status || "Pending");

    const address = escapeHtml(order.customerAddress || "");
    const city = escapeHtml(order.customerCity || "");
    const pinCode = escapeHtml(order.customerPinCode || "");

    const phone = escapeHtml(order.customerPhone || "");

    const paymentMethod = escapeHtml(
      order.paymentMethod || "Not specified"
    );

    const paymentStatus = escapeHtml(
      order.paymentStatus || "Pending"
    );

    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHtml = items.map((item) => {
      const title = escapeHtml(item.title || "Product");
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      return `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">
            ${title}
          </td>

          <td style="padding:10px;border:1px solid #ddd;text-align:center;">
            ${quantity}
          </td>

          <td style="padding:10px;border:1px solid #ddd;text-align:right;">
            ₹${price.toFixed(2)}
          </td>

          <td style="padding:10px;border:1px solid #ddd;text-align:right;">
            ₹${(price * quantity).toFixed(2)}
          </td>
        </tr>
      `;
    }).join("");

    const timeline = Array.isArray(order.timeline)
      ? order.timeline
      : [];

    const timelineHtml = timeline.map((item) => {
      return `
        <div style="
          padding:10px;
          margin-bottom:8px;
          border-left:3px solid #29a9e0;
          background:#f8fafc;
        ">
          <strong>${escapeHtml(item.status || "")}</strong>

          <div style="font-size:13px;color:#555;">
            ${escapeHtml(
              item.date
                ? new Date(item.date).toLocaleString("en-IN")
                : ""
            )}
          </div>

          <div style="font-size:13px;color:#555;">
            ${escapeHtml(item.remarks || "")}
          </div>
        </div>
      `;
    }).join("");

    const subtotal = Number(order.subtotal) || 0;
    const shipping = Number(order.shippingCharge) || 0;
    const tax = Number(order.tax) || 0;
    const discount = Number(order.discount) || 0;
    const grandTotal = Number(order.grandTotal) || 0;

    const isPlaced = emailType === "placed";

    const subject = isPlaced
      ? `Order Confirmed - ${orderId} | Vani Systems`
      : `Order Status Updated - ${orderId} | Vani Systems`;

    const heading = isPlaced
      ? "Your Order Has Been Placed Successfully!"
      : "Your Order Status Has Been Updated!";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>

      <body style="
        margin:0;
        padding:20px;
        background:#f3f4f6;
        font-family:Arial,sans-serif;
        color:#111827;
      ">

        <div style="
          max-width:700px;
          margin:auto;
          background:#ffffff;
          border-radius:10px;
          overflow:hidden;
        ">

          <div style="
            background:#159bd0;
            color:#ffffff;
            text-align:center;
            padding:25px;
          ">
            <h1 style="margin:0;">Vani Systems</h1>
            <p style="margin:8px 0 0;">Order Notification</p>
          </div>

          <div style="padding:25px;">

            <h2>Hello ${customerName},</h2>

            <h3 style="color:#159bd0;">
              ${heading}
            </h3>

            <p>
              ${
                isPlaced
                  ? "Thank you for placing your order with Vani Systems."
                  : "Your order progress has been updated by our team."
              }
            </p>

            <div style="
              padding:15px;
              background:#f0f9ff;
              border-radius:8px;
              margin:20px 0;
            ">
              <p><strong>Current Order Status:</strong> ${status}</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            </div>

            ${getOrderProgressHtml(order.status)}

            <h3>Order Items</h3>

            <table style="
              width:100%;
              border-collapse:collapse;
              font-size:13px;
            ">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:10px;border:1px solid #ddd;text-align:left;">
                    Product
                  </th>

                  <th style="padding:10px;border:1px solid #ddd;">
                    Quantity
                  </th>

                  <th style="padding:10px;border:1px solid #ddd;">
                    Price
                  </th>

                  <th style="padding:10px;border:1px solid #ddd;">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <h3>Amount Details</h3>

            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:7px;">Subtotal</td>
                <td style="padding:7px;text-align:right;">
                  ₹${subtotal.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style="padding:7px;">Shipping</td>
                <td style="padding:7px;text-align:right;">
                  ₹${shipping.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style="padding:7px;">GST / Tax</td>
                <td style="padding:7px;text-align:right;">
                  ₹${tax.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style="padding:7px;">Discount</td>
                <td style="padding:7px;text-align:right;">
                  - ₹${discount.toFixed(2)}
                </td>
              </tr>

              <tr style="font-weight:bold;background:#f0fdf4;">
                <td style="padding:12px;">Grand Total</td>
                <td style="padding:12px;text-align:right;">
                  ₹${grandTotal.toFixed(2)}
                </td>
              </tr>
            </table>

            <h3>Payment Details</h3>

            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${paymentStatus}</p>

            <h3>Delivery Details</h3>

            <div style="
              padding:15px;
              background:#f9fafb;
              border:1px solid #e5e7eb;
              border-radius:8px;
            ">
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Phone:</strong> ${phone || "Not provided"}</p>

              <p>
                <strong>Delivery Address:</strong><br>
                ${address || "Address not available"}
              </p>

              <p><strong>City:</strong> ${city || "Not provided"}</p>
              <p><strong>PIN Code:</strong> ${pinCode || "Not provided"}</p>
            </div>

            <h3>Order History</h3>

            ${timelineHtml || "<p>No order history available.</p>"}

            <p style="margin-top:25px;">
              Thank you for choosing Vani Systems.
            </p>

            <p>
              Regards,<br>
              <strong>Vani Systems Team</strong>
            </p>

          </div>

          <div style="
            background:#f3f4f6;
            text-align:center;
            padding:15px;
            font-size:12px;
            color:#666;
          ">
            This is an automatically generated order notification.
            Please do not reply to this email.
          </div>

        </div>

      </body>
      </html>
    `;

    const text = `
Hello ${order.customerName || "Customer"},

${heading}

Order ID: ${order.orderId}
Invoice Number: ${order.invoiceNumber}
Tracking Number: ${order.trackingNumber}

Current Status: ${order.status}

Delivery Address: ${order.customerAddress || "Not available"}
City: ${order.customerCity || "Not available"}
PIN Code: ${order.customerPinCode || "Not available"}

Phone: ${order.customerPhone || "Not available"}

Payment Method: ${order.paymentMethod}
Payment Status: ${order.paymentStatus}

Grand Total: Rs. ${grandTotal.toFixed(2)}

Thank you,
Vani Systems
    `;

    const mailResult = await transporter.sendMail({
      from: {
        name: "Vani Systems",
        address: emailUser,
      },
      to: customerEmail,
      replyTo: emailUser,
      subject,
      text,
      html,
    });

    if (
      !mailResult.accepted ||
      mailResult.accepted.length === 0 ||
      (mailResult.rejected && mailResult.rejected.length > 0)
    ) {
      throw new Error("Order email was not accepted by the mail server.");
    }

    console.log(
      `Order email sent successfully: ${order.orderId} -> ${customerEmail}`
    );

    return {
      success: true,
      message: "Order email sent successfully.",
    };
  } catch (error) {
    console.error("Order Email Error:", error);

    return {
      success: false,
      message: error.message,
    };
  }
};

// ==========================================
// CREATE ORDER
// ==========================================

const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order.",
      });
    }

    // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    const shippingAddress = req.body.shippingAddress || {};

    const customerName =
      req.body.customerName ||
      shippingAddress.fullName ||
      req.user.name ||
      "Customer";

    const customerEmail =
      req.user.email ||
      req.body.customerEmail ||
      "";

    const customerPhone =
      req.body.customerPhone ||
      shippingAddress.phone ||
      req.user.phone ||
      "";

    // ==========================================
    // DELIVERY ADDRESS MAPPING
    // CHECKOUT SHIPPING ADDRESS SUPPORT
    // ==========================================

    const addressObject =
      typeof shippingAddress === "object" &&
      shippingAddress !== null
        ? shippingAddress
        : {};

    const customerAddress =
      req.body.customerAddress ||
      (
        typeof shippingAddress === "string"
          ? shippingAddress
          : [
              addressObject.address,
              addressObject.state,
            ]
              .filter(Boolean)
              .join(", ")
      ) ||
      req.body.address ||
      "";

    const customerCity =
      req.body.customerCity ||
      addressObject.city ||
      req.body.city ||
      "";

    const customerPinCode =
      req.body.customerPinCode ||
      addressObject.pincode ||
      addressObject.pinCode ||
      req.body.pinCode ||
      "";

    // ==========================================
    // ORDER ITEMS
    // ==========================================

    const items = Array.isArray(req.body.items)
      ? req.body.items.map((item) => ({
          id: item.id || item.productId || item._id,
          title: item.title || item.name || "Product",
          image: item.image || "",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        }))
      : [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Order items are required.",
      });
    }

    // ==========================================
    // GENERATE ORDER DETAILS
    // ==========================================

    const orderData = {
      orderId: generateOrderId(),
      invoiceNumber: generateInvoiceNumber(),
      trackingNumber: generateTrackingNumber(),

      userId: req.user._id,

      customerName,
      customerEmail,
      customerPhone,

      customerAddress,
      customerCity,
      customerPinCode,

      items,

      totalItems: Number(req.body.totalItems) || 0,

      subtotal: Number(req.body.subtotal) || 0,

      shippingCharge:
        Number(
          req.body.shippingCharge ??
          req.body.totalShipping
        ) || 0,

      tax:
        Number(
          req.body.tax ??
          req.body.totalGST
        ) || 0,

      discount:
        Number(
          req.body.discount ??
          req.body.couponDiscount
        ) || 0,

      grandTotal: Number(req.body.grandTotal) || 0,

      paymentMethod: req.body.paymentMethod || "Cash On Delivery",

      // UPI AND COD BOTH START AS PENDING.
      // ADMIN WILL VERIFY PAYMENT.

      paymentStatus: "Pending",

      status: "Pending",

      timeline: [
        {
          status: "Order Placed",
          date: new Date(),
          remarks: "Order received successfully",
          adminName: "System",
        },
      ],

      tracking: {
        currentLocation: "Processing Center",

        estimatedDelivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),

        trackingHistory: [
          {
            status: "Order Placed",
            location: "Processing Center",
            date: new Date(),
            remarks: "Your order has been received.",
          },
        ],
      },
    };

    // ==========================================
    // SAVE ORDER
    // ==========================================

    const order = new Order(orderData);

    await order.save();

    // ==========================================
    // SOCKET.IO - NEW ORDER NOTIFICATION
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("new-order", order);
    }

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    await createAndSendNotification(req.app, {
      userId: order.userId,
      title: "Order Placed Successfully",
      message: `Your order ${order.orderId} has been placed successfully.`,
      type: "order",
      orderId: order._id,
    });

    // ==========================================
    // SEND ORDER CONFIRMATION EMAIL
    // ==========================================

    const emailResult = await sendOrderEmail(order, "placed");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: {
        order,
        emailSent: emailResult.success,
        emailError: emailResult.success
          ? null
          : emailResult.message,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order.",
    });
  }
};

// ==========================================
// GET ALL ORDERS
// ==========================================

const getAllOrders = async (req, res) => {
  try {
    let orders;

    if (
      req.user &&
      ["admin", "Admin"].includes(req.user.role)
    ) {
      orders = await Order.find()
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({
        userId: req.user._id,
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ORDER BY ID
// ==========================================

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [
        { _id: req.params.id },
        { orderId: req.params.id },
      ],
    }).populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isAdmin =
      req.user &&
      ["admin", "Admin"].includes(req.user.role);

    if (
      !isAdmin &&
      String(order.userId?._id || order.userId) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS
// ADMIN STATUS UPDATE + CUSTOMER EMAIL
// ==========================================

const updateOrderStatus = async (req, res) => {
  try {
    const isAdmin =
      req.user &&
      ["admin", "Admin"].includes(req.user.role);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admin can update order status.",
      });
    }

    const order = await Order.findOne({
      orderId: req.params.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const requestedStatus =
      req.body.status ||
      req.body.orderStatus;

    const newStatus = normalizeOrderStatus(requestedStatus);

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Packed",
      "Ready To Ship",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Completed",
      "Cancelled",
      "Returned",
      "Refunded",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order status is not supported.",
      });
    }

    const oldStatus = order.status;

    if (oldStatus === newStatus) {
      return res.status(200).json({
        success: true,
        message: "Order already has this status.",
        data: order,
        emailSent: false,
      });
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    order.status = newStatus;

    // ==========================================
    // UPDATE TIMELINE
    // ==========================================

    order.timeline.push({
      status: newStatus,
      date: new Date(),
      remarks:
        req.body.remarks ||
        `Order status changed from ${oldStatus} to ${newStatus}`,
      adminName:
        req.user.name ||
        req.user.email ||
        "Admin",
    });

    // ==========================================
    // UPDATE TRACKING HISTORY
    // ==========================================

    if (!order.tracking) {
      order.tracking = {
        currentLocation: "",
        trackingHistory: [],
      };
    }

    if (!Array.isArray(order.tracking.trackingHistory)) {
      order.tracking.trackingHistory = [];
    }

    order.tracking.trackingHistory.push({
      status: newStatus,
      location:
        req.body.location ||
        order.tracking.currentLocation ||
        "Processing Center",
      date: new Date(),
      remarks:
        req.body.remarks ||
        `Order status updated to ${newStatus}`,
    });

    if (req.body.location) {
      order.tracking.currentLocation = req.body.location;
    }

    // ==========================================
    // SAVE UPDATED ORDER
    // ==========================================

    await order.save();

    // ==========================================
    // SOCKET.IO STATUS UPDATE
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);

      io.emit("order-status-updated", {
        orderId: order.orderId,
        status: order.status,
        userId: order.userId,
      });
    }

    // ==========================================
    // CUSTOMER NOTIFICATION
    // ==========================================

    await createAndSendNotification(req.app, {
      userId: order.userId,
      title: "Order Status Updated",
      message: `Your order ${order.orderId} is now ${newStatus}.`,
      type: "order",
      orderId: order._id,
    });

    // ==========================================
    // SEND UPDATED STATUS EMAIL
    // ==========================================

    const emailResult = await sendOrderEmail(order, "updated");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
      emailSent: emailResult.success,
      emailError: emailResult.success
        ? null
        : emailResult.message,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
};

// ==========================================
// CANCEL ORDER
// ==========================================

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [
        { _id: req.params.id },
        { orderId: req.params.id },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isAdmin =
      req.user &&
      ["admin", "Admin"].includes(req.user.role);

    if (
      !isAdmin &&
      String(order.userId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order.",
      });
    }

    if (
      ["Delivered", "Completed", "Returned", "Refunded"].includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled.",
      });
    }

    order.status = "Cancelled";

    order.cancellationReason =
      req.body.reason ||
      req.body.cancellationReason ||
      "Cancelled by customer.";

    order.timeline.push({
      status: "Cancelled",
      date: new Date(),
      remarks: order.cancellationReason,
      adminName: isAdmin ? "Admin" : "Customer",
    });

    if (order.tracking) {
      if (!Array.isArray(order.tracking.trackingHistory)) {
        order.tracking.trackingHistory = [];
      }

      order.tracking.trackingHistory.push({
        status: "Cancelled",
        location: order.tracking.currentLocation || "",
        date: new Date(),
        remarks: order.cancellationReason,
      });
    }

    await order.save();

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);
      io.emit("order-status-updated", {
        orderId: order.orderId,
        status: order.status,
        userId: order.userId,
      });
    }

    await createAndSendNotification(req.app, {
      userId: order.userId,
      title: "Order Cancelled",
      message: `Your order ${order.orderId} has been cancelled.`,
      type: "order",
      orderId: order._id,
    });

    const emailResult = await sendOrderEmail(order, "updated");

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
      emailSent: emailResult.success,
      emailError: emailResult.success
        ? null
        : emailResult.message,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// RETURN ORDER
// ==========================================

const returnOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [
        { _id: req.params.id },
        { orderId: req.params.id },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isAdmin =
      req.user &&
      ["admin", "Admin"].includes(req.user.role);

    if (
      !isAdmin &&
      String(order.userId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to return this order.",
      });
    }

    if (
      !["Delivered", "Completed"].includes(order.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Only delivered or completed orders can be returned.",
      });
    }

    order.status = "Returned";

    order.returnReason =
      req.body.reason ||
      req.body.returnReason ||
      "Return requested.";

    order.timeline.push({
      status: "Returned",
      date: new Date(),
      remarks: order.returnReason,
      adminName: isAdmin ? "Admin" : "Customer",
    });

    if (order.tracking) {
      if (!Array.isArray(order.tracking.trackingHistory)) {
        order.tracking.trackingHistory = [];
      }

      order.tracking.trackingHistory.push({
        status: "Returned",
        location: order.tracking.currentLocation || "",
        date: new Date(),
        remarks: order.returnReason,
      });
    }

    await order.save();

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);
      io.emit("order-status-updated", {
        orderId: order.orderId,
        status: order.status,
        userId: order.userId,
      });
    }

    await createAndSendNotification(req.app, {
      userId: order.userId,
      title: "Order Return Updated",
      message: `Your order ${order.orderId} has been marked as Returned.`,
      type: "order",
      orderId: order._id,
    });

    const emailResult = await sendOrderEmail(order, "updated");

    return res.status(200).json({
      success: true,
      message: "Order return processed successfully.",
      data: order,
      emailSent: emailResult.success,
      emailError: emailResult.success
        ? null
        : emailResult.message,
    });
  } catch (error) {
    console.error("Return Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ORDER STATISTICS
// ==========================================

const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: "Pending",
    });

    const confirmedOrders = await Order.countDocuments({
      status: "Confirmed",
    });

    const processingOrders = await Order.countDocuments({
      status: "Processing",
    });

    const shippedOrders = await Order.countDocuments({
      status: "Shipped",
    });

    const outForDeliveryOrders = await Order.countDocuments({
      status: {
        $in: ["Out for Delivery", "Out For Delivery"],
      },
    });

    const deliveredOrders = await Order.countDocuments({
      status: "Delivered",
    });

    const completedOrders = await Order.countDocuments({
      status: "Completed",
    });

    const cancelledOrders = await Order.countDocuments({
      status: "Cancelled",
    });

    const returnedOrders = await Order.countDocuments({
      status: "Returned",
    });

    const refundedOrders = await Order.countDocuments({
      status: "Refunded",
    });

    const salesResult = await Order.aggregate([
      {
        $match: {
          status: {
            $in: ["Delivered", "Completed"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$grandTotal",
          },
        },
      },
    ]);

    const totalSales =
      salesResult.length > 0
        ? salesResult[0].totalSales
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        completedOrders,
        cancelledOrders,
        returnedOrders,
        refundedOrders,
        totalSales,
      },
    });
  } catch (error) {
    console.error("Get Order Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  getOrderStats,
};







