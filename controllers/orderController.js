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









// ==============================
// controllers/orderController.js
// ==============================
const Order = require('../models/Order');
const nodemailer = require('nodemailer');

// ======================================================
// EMAIL HTML ESCAPE HELPER
// ======================================================
const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ======================================================
// CREATE EMAIL TRANSPORTER
// SAME SMTP SETTINGS AS CANDIDATE REGISTRATION
// ======================================================
const createEmailTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const smtpHost =
    process.env.EMAIL_HOST || 'smtp.gmail.com';

  const smtpPort =
    Number(process.env.EMAIL_PORT) || 587;

  if (!emailUser || !emailPass) {
    throw new Error('Email SMTP credentials are missing.');
  }

  if (![465, 587].includes(smtpPort)) {
    throw new Error('Invalid SMTP port. Use 465 or 587.');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
};

// ======================================================
// ORDER PROGRESS STEPS
// ======================================================
const ORDER_PROGRESS_STEPS = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Ready To Ship',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

// ======================================================
// FORMAT CURRENCY
// ======================================================
const formatAmount = (amount) => {
  const value = Number(amount) || 0;

  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// ======================================================
// GET ORDER PROGRESS HTML
// ======================================================
const getOrderProgressHtml = (currentStatus) => {
  const currentIndex =
    ORDER_PROGRESS_STEPS.indexOf(currentStatus);

  const isCancelled =
    ['Cancelled', 'Returned', 'Refunded'].includes(currentStatus);

  let stepsHtml = '';

  ORDER_PROGRESS_STEPS.forEach((step, index) => {
    const completed =
      currentIndex >= 0 && index <= currentIndex;

    const isCurrent =
      currentStatus === step;

    const background = completed ? '#198754' : '#d9dee7';
    const textColor = completed ? '#198754' : '#777777';

    stepsHtml += `
      <td style="
        width:${100 / ORDER_PROGRESS_STEPS.length}%;
        text-align:center;
        vertical-align:top;
        padding:5px 2px;
      ">
        <div style="
          width:19px;
          height:19px;
          line-height:19px;
          margin:0 auto 7px;
          border-radius:50%;
          background:${background};
          color:#ffffff;
          font-size:12px;
          font-weight:bold;
        ">
          ${completed ? '&#10003;' : (index + 1)}
        </div>

        <div style="
          font-size:10px;
          line-height:1.4;
          color:${textColor};
          font-weight:${isCurrent ? 'bold' : 'normal'};
          word-break:break-word;
        ">
          ${escapeHtml(step)}
          ${isCurrent ? '<br>(Current)' : ''}
        </div>
      </td>
    `;
  });

  return `
    <div style="
      margin:22px 0;
      padding:18px 10px;
      background:#f7f9fc;
      border:1px solid #e5e7eb;
      border-radius:8px;
    ">
      <h3 style="
        margin:0 0 18px;
        color:#173b68;
        font-size:17px;
        text-align:center;
      ">
        Your Order Progress
      </h3>

      ${
        isCancelled
          ? `
            <div style="
              padding:12px;
              background:#fff0f0;
              border:1px solid #f3c4c4;
              color:#b42318;
              text-align:center;
              border-radius:6px;
              font-weight:bold;
            ">
              Order ${escapeHtml(currentStatus)}
            </div>
          `
          : `
            <table style="
              width:100%;
              border-collapse:collapse;
              table-layout:fixed;
            ">
              <tr>${stepsHtml}</tr>
            </table>
          `
      }

      <p style="
        margin:15px 0 0;
        text-align:center;
        font-size:14px;
        color:#333333;
      ">
        Current Status:
        <strong style="color:#198754;">
          ${escapeHtml(currentStatus)}
        </strong>
      </p>
    </div>
  `;
};

// ======================================================
// SEND ORDER EMAIL
// ORDER PLACED + EVERY ADMIN STATUS UPDATE
// ======================================================
const sendOrderEmail = async (order, emailType = 'status') => {
  const emailUser = process.env.EMAIL_USER;

  if (!order.customerEmail || !String(order.customerEmail).trim()) {
    throw new Error('Customer email address is missing.');
  }

  const transporter = createEmailTransporter();

  await transporter.verify();

  const customerName =
    escapeHtml(order.customerName || 'Customer');

  const orderId =
    escapeHtml(order.orderId || '');

  const invoiceNumber =
    escapeHtml(order.invoiceNumber || '');

  const trackingNumber =
    escapeHtml(order.trackingNumber || '');

  const orderStatus =
    escapeHtml(order.status || 'Pending');

  const paymentMethod =
    escapeHtml(order.paymentMethod || 'Not specified');

  const paymentStatus =
    escapeHtml(order.paymentStatus || 'Pending');

  const customerAddress =
    escapeHtml(order.customerAddress || 'Address not provided');

  const customerCity =
    escapeHtml(order.customerCity || '');

  const customerPinCode =
    escapeHtml(order.customerPinCode || '');

  const customerPhone =
    escapeHtml(order.customerPhone || 'Not provided');

  const currentLocation =
    escapeHtml(
      order.tracking?.currentLocation || 'Processing Center'
    );

  const estimatedDelivery =
    escapeHtml(
      order.tracking?.estimatedDelivery || 'Will be updated'
    );

  const items = Array.isArray(order.items) ? order.items : [];

  let itemsHtml = '';
  let itemsText = '';

  items.forEach((item, index) => {
    const title =
      escapeHtml(item.title || `Product ${index + 1}`);

    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.price) || 0;

    const lineTotal = quantity * price;

    itemsHtml += `
      <tr>
        <td style="padding:10px;border:1px solid #dddddd;">
          ${title}
        </td>
        <td style="padding:10px;border:1px solid #dddddd;text-align:center;">
          ${quantity}
        </td>
        <td style="padding:10px;border:1px solid #dddddd;text-align:right;">
          ${formatAmount(price)}
        </td>
        <td style="padding:10px;border:1px solid #dddddd;text-align:right;">
          ${formatAmount(lineTotal)}
        </td>
      </tr>
    `;

    itemsText +=
      `${index + 1}. ${item.title || 'Product'} | Quantity: ${quantity} | Price: ${formatAmount(price)} | Total: ${formatAmount(lineTotal)}\n`;
  });

  const subject =
    emailType === 'placed'
      ? `Order Placed Successfully - ${order.orderId}`
      : `Your Order Status Updated - ${order.orderId}: ${order.status}`;

  const heading =
    emailType === 'placed'
      ? 'Your Order Has Been Placed Successfully!'
      : 'Your Order Status Has Been Updated!';

  const intro =
    emailType === 'placed'
      ? 'Thank you for shopping with Vani Systems. We have successfully received your order.'
      : `Your order status has been updated to ${order.status}.`;

  const timeline = Array.isArray(order.timeline)
    ? order.timeline
    : [];

  let timelineHtml = '';

  timeline.forEach((entry) => {
    timelineHtml += `
      <tr>
        <td style="padding:9px;border:1px solid #dddddd;">
          ${escapeHtml(entry.status || '')}
        </td>
        <td style="padding:9px;border:1px solid #dddddd;">
          ${escapeHtml(entry.date || '')}
        </td>
        <td style="padding:9px;border:1px solid #dddddd;">
          ${escapeHtml(entry.remarks || '')}
        </td>
      </tr>
    `;
  });

  const timelineText = timeline
    .map((entry) =>
      `${entry.status || ''} | ${entry.date || ''} | ${entry.remarks || ''}`
    )
    .join('\n');

  const mailOptions = {
    from: {
      name: 'Vani Systems',
      address: emailUser
    },

    // EMAIL ONLY TO CUSTOMER
    to: order.customerEmail,

    replyTo: emailUser,

    subject,

    text: `
Dear ${order.customerName || 'Customer'},

${intro}

ORDER DETAILS

Order ID: ${order.orderId}
Invoice Number: ${order.invoiceNumber}
Tracking Number: ${order.trackingNumber}
Order Status: ${order.status}

PRODUCT DETAILS

${itemsText}

Total Items: ${order.totalItems || 0}
Subtotal: ${formatAmount(order.subtotal)}
Shipping Charge: ${formatAmount(order.shippingCharge)}
Tax: ${formatAmount(order.tax)}
Discount: ${formatAmount(order.discount)}
Grand Total: ${formatAmount(order.grandTotal)}

PAYMENT DETAILS

Payment Method: ${order.paymentMethod}
Payment Status: ${order.paymentStatus}

DELIVERY DETAILS

Customer Name: ${order.customerName}
Phone: ${order.customerPhone}
Address: ${order.customerAddress}
City: ${order.customerCity}
PIN Code: ${order.customerPinCode}
Current Location: ${order.tracking?.currentLocation || 'Processing Center'}
Estimated Delivery: ${order.tracking?.estimatedDelivery || 'Will be updated'}

ORDER PROGRESS

${timelineText}

Thank you for choosing Vani Systems.

Regards,
Vani Systems Team
https://vanisystems.in

This is an automatic order notification email.
    `,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vani Systems Order Update</title>
</head>

<body style="
  margin:0;
  padding:20px;
  background:#f4f6f9;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:650px;
    margin:20px auto;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:10px;
    overflow:hidden;
  ">

    <div style="
      background:#173b68;
      padding:25px 20px;
      text-align:center;
      color:#ffffff;
    ">
      <h2 style="margin:0;font-size:25px;">
        VANI SYSTEMS
      </h2>

      <p style="margin:10px 0 0;font-size:14px;">
        Order Confirmation & Tracking
      </p>
    </div>

    <div style="
      padding:25px 22px;
      color:#333333;
    ">

      <h2 style="
        color:#198754;
        font-size:21px;
        margin-top:0;
      ">
        ${heading}
      </h2>

      <p style="font-size:15px;line-height:1.7;">
        Dear <strong>${customerName}</strong>,
      </p>

      <p style="font-size:15px;line-height:1.7;">
        ${intro}
      </p>

      ${getOrderProgressHtml(order.status || 'Pending')}

      <div style="
        margin:22px 0;
        padding:17px;
        background:#f0f5ff;
        border:1px solid #d6e4ff;
        border-radius:8px;
      ">
        <p style="margin:5px 0;font-size:14px;">
          <strong>Order ID:</strong> ${orderId}
        </p>

        <p style="margin:5px 0;font-size:14px;">
          <strong>Invoice Number:</strong> ${invoiceNumber}
        </p>

        <p style="margin:5px 0;font-size:14px;">
          <strong>Tracking Number:</strong> ${trackingNumber}
        </p>

        <p style="margin:5px 0;font-size:14px;">
          <strong>Current Status:</strong>
          <span style="color:#198754;font-weight:bold;">
            ${orderStatus}
          </span>
        </p>
      </div>

      <h3 style="color:#173b68;font-size:17px;">
        Product Details
      </h3>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      ">
        <tr style="background:#f1f3f5;">
          <th style="padding:10px;border:1px solid #dddddd;text-align:left;">Product</th>
          <th style="padding:10px;border:1px solid #dddddd;">Qty</th>
          <th style="padding:10px;border:1px solid #dddddd;text-align:right;">Price</th>
          <th style="padding:10px;border:1px solid #dddddd;text-align:right;">Total</th>
        </tr>

        ${itemsHtml || `
          <tr>
            <td colspan="4" style="padding:10px;border:1px solid #dddddd;">
              Product details unavailable
            </td>
          </tr>
        `}
      </table>

      <h3 style="color:#173b68;font-size:17px;margin-top:25px;">
        Amount Details
      </h3>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
      ">
        <tr>
          <td style="padding:9px;border:1px solid #dddddd;">Total Items</td>
          <td style="padding:9px;border:1px solid #dddddd;text-align:right;">
            ${Number(order.totalItems) || 0}
          </td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;">Subtotal</td>
          <td style="padding:9px;border:1px solid #dddddd;text-align:right;">
            ${formatAmount(order.subtotal)}
          </td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;">Shipping Charge</td>
          <td style="padding:9px;border:1px solid #dddddd;text-align:right;">
            ${formatAmount(order.shippingCharge)}
          </td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;">Tax</td>
          <td style="padding:9px;border:1px solid #dddddd;text-align:right;">
            ${formatAmount(order.tax)}
          </td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;">Discount</td>
          <td style="padding:9px;border:1px solid #dddddd;text-align:right;">
            ${formatAmount(order.discount)}
          </td>
        </tr>

        <tr style="background:#f0f5ff;">
          <td style="padding:12px;border:1px solid #dddddd;">
            <strong>Grand Total</strong>
          </td>
          <td style="padding:12px;border:1px solid #dddddd;text-align:right;color:#173b68;">
            <strong>${formatAmount(order.grandTotal)}</strong>
          </td>
        </tr>
      </table>

      <h3 style="color:#173b68;font-size:17px;margin-top:25px;">
        Payment Details
      </h3>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
      ">
        <tr>
          <td style="padding:10px;border:1px solid #dddddd;">
            <strong>Payment Method</strong>
          </td>
          <td style="padding:10px;border:1px solid #dddddd;">
            ${paymentMethod}
          </td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #dddddd;">
            <strong>Payment Status</strong>
          </td>
          <td style="padding:10px;border:1px solid #dddddd;">
            ${paymentStatus}
          </td>
        </tr>
      </table>

      <h3 style="color:#173b68;font-size:17px;margin-top:25px;">
        Delivery Details
      </h3>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
      ">
        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>Name</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${customerName}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>Phone</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${customerPhone}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>Address</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${customerAddress}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>City</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${customerCity}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>PIN Code</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${customerPinCode}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>Current Location</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${currentLocation}</td>
        </tr>

        <tr>
          <td style="padding:9px;border:1px solid #dddddd;"><strong>Estimated Delivery</strong></td>
          <td style="padding:9px;border:1px solid #dddddd;">${estimatedDelivery}</td>
        </tr>
      </table>

      <h3 style="color:#173b68;font-size:17px;margin-top:25px;">
        Order Status History
      </h3>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      ">
        <tr style="background:#f1f3f5;">
          <th style="padding:9px;border:1px solid #dddddd;text-align:left;">Status</th>
          <th style="padding:9px;border:1px solid #dddddd;text-align:left;">Date</th>
          <th style="padding:9px;border:1px solid #dddddd;text-align:left;">Remarks</th>
        </tr>

        ${timelineHtml || `
          <tr>
            <td colspan="3" style="padding:10px;border:1px solid #dddddd;">
              No status history available
            </td>
          </tr>
        `}
      </table>

      <p style="
        font-size:15px;
        line-height:1.7;
        margin-top:25px;
      ">
        Thank you for choosing Vani Systems.
      </p>

      <p style="
        font-size:15px;
        line-height:1.7;
      ">
        Regards,<br>
        <strong>Vani Systems Team</strong><br>
        Vani Systems Pvt. Ltd.
      </p>

    </div>

    <div style="
      background:#f1f3f5;
      padding:16px;
      text-align:center;
      font-size:12px;
      color:#666666;
    ">
      <p style="margin:5px 0;">
        Vani Systems Pvt. Ltd.
      </p>

      <p style="margin:5px 0;">
        <a href="https://vanisystems.in"
           style="color:#173b68;text-decoration:none;">
          www.vanisystems.in
        </a>
      </p>

      <p style="margin:5px 0;">
        This is an automatic order notification email.
      </p>
    </div>

  </div>
</body>
</html>
    `
  };

  const mailResult =
    await transporter.sendMail(mailOptions);

  if (
    !mailResult.accepted ||
    mailResult.accepted.length === 0 ||
    (mailResult.rejected && mailResult.rejected.length > 0)
  ) {
    throw new Error('Order email was not accepted by the email server.');
  }

  return mailResult;
};

// ======================================================
// ORDER ID GENERATOR
// ======================================================
const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

// ======================================================
// INVOICE NUMBER GENERATOR
// ======================================================
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);
  return `INV-${timestamp}-${random}`;
};

// ======================================================
// TRACKING NUMBER GENERATOR
// ======================================================
const generateTrackingNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${timestamp}-${random}`;
};

// ======================================================
// CREATE AND SEND NOTIFICATION
// ======================================================
const createAndSendNotification = async (app, data) => {
  try {
    if (!app) {
      return;
    }
    const notificationController = require('./notificationController');
    if (
      notificationController &&
      typeof notificationController.createNotification === 'function'
    ) {
      await notificationController.createNotification({
        body: data
      });
    }
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

// ==============================
// CREATE ORDER
// ==============================
exports.createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const generatedId = generateOrderId();

    const targetEmail =
      req.user?.email ||
      req.body.customerEmail ||
      '';

    const targetName =
      req.body.customerName ||
      req.user?.name ||
      'Customer';

    const targetPhone =
      req.body.customerPhone ||
      req.user?.phone ||
      '';

    const orderData = {
      orderId: generatedId,
      invoiceNumber: generateInvoiceNumber(),
      trackingNumber: generateTrackingNumber(),
      userId: req.user._id || req.user.id,
      customerEmail: targetEmail,
      customerName: targetName,
      customerPhone: targetPhone,
      customerAddress: req.body.customerAddress || '',
      customerCity: req.body.customerCity || '',
      customerPinCode: req.body.customerPinCode || '',
      items: Array.isArray(req.body.items) ? req.body.items : [],
      totalItems: Number(req.body.totalItems) || 0,
      subtotal: Number(req.body.subtotal) || 0,
      shippingCharge: 0,
      tax: 0,
      discount: Number(req.body.discount) || 0,
      grandTotal: Number(req.body.grandTotal) || 0,
      paymentMethod: req.body.paymentMethod || 'Cash On Delivery',

      // PAYMENT WILL REMAIN PENDING UNTIL ADMIN VERIFIES IT
      paymentStatus: 'Pending',

      status: 'Pending',
      timeline: [
        {
          status: 'Order Placed',
          date: new Date().toLocaleString(),
          remarks: 'Order received successfully',
          adminName: 'System'
        }
      ],
      tracking: {
        currentLocation: 'Processing Center',
        estimatedDelivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString(),
        trackingHistory: [
          {
            status: 'Order Placed',
            location: 'Processing Center',
            date: new Date().toLocaleString(),
            time: new Date().toLocaleTimeString()
          }
        ]
      }
    };

    const order = await Order.create(orderData);

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-order', order);
    }

    await createAndSendNotification(req.app, {
      userId: req.user._id || req.user.id,
      userEmail: targetEmail,
      title: '📦 Order Placed Successfully!',
      message: `Thank you for your purchase. Your order ID is ${generatedId}.`,
      type: 'order'
    });

    // ==================================================
    // SEND ORDER PLACED EMAIL TO CUSTOMER
    // ==================================================
    let emailSent = false;
    let emailError = null;

    try {
      const mailResult = await sendOrderEmail(order, 'placed');

      emailSent = true;

      console.log(
        'Order confirmation email accepted:',
        order.customerEmail,
        'Order:',
        order.orderId,
        'Message ID:',
        mailResult.messageId
      );
    } catch (mailError) {
      emailSent = false;
      emailError = mailError.message;

      console.error(
        'Order confirmation email error:',
        mailError
      );
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? 'Order created successfully. Confirmation email has been sent.'
        : 'Order created successfully, but confirmation email could not be sent.',
      emailSent,
      ...(emailSent ? {} : { emailError }),
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

// ==============================
// GET ALL ORDERS
// ==============================
exports.getAllOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'Admin';

    let orders;

    if (isAdmin) {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({
        userId: req.user._id || req.user.id
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    });
  }
};

// ==============================
// GET ORDER BY ID
// ==============================
exports.getOrderById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'Admin';

    const orderUserId = order.userId ? order.userId.toString() : '';
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isAdmin && orderUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order'
    });
  }
};

// ==============================
// UPDATE ORDER STATUS
// ==============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'Admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only admin can update order status'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Order status is required'
      });
    }

    // Normalize status (case-insensitive)
    const normalizedStatus = status.trim().toLowerCase();

    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'packed': 'Packed',
      'ready to ship': 'Ready To Ship',
      'readytoship': 'Ready To Ship',
      'shipped': 'Shipped',
      'out for delivery': 'Out for Delivery',
      'outfordelivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'canceled': 'Cancelled',
      'returned': 'Returned',
      'refunded': 'Refunded'
    };

    const finalStatus =
      statusMap[normalizedStatus] || status.trim();

    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Processing',
      'Packed',
      'Ready To Ship',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Completed',
      'Cancelled',
      'Returned',
      'Refunded'
    ];

    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order status. Allowed statuses: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const previousStatus = order.status;

    order.status = finalStatus;

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }

    order.timeline.push({
      status: finalStatus,
      date: new Date().toLocaleString(),
      remarks: remarks || `Order status changed to ${finalStatus}`,
      adminName: req.user?.name || req.user?.email || 'Admin'
    });

    if (!order.tracking) {
      order.tracking = {
        currentLocation: 'Processing Center',
        estimatedDelivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString(),
        trackingHistory: []
      };
    }

    if (!Array.isArray(order.tracking.trackingHistory)) {
      order.tracking.trackingHistory = [];
    }

    order.tracking.trackingHistory.push({
      status: finalStatus,
      location: order.tracking.currentLocation || 'Processing Center',
      date: new Date().toLocaleString(),
      time: new Date().toLocaleTimeString()
    });

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.userId}`).emit('order-status-updated', order);
      io.to('admin-room').emit('order-status-updated', order);
    }

    // ==================================================
    // SEND EMAIL ONLY WHEN STATUS ACTUALLY CHANGES
    // ==================================================
    let emailSent = false;
    let emailError = null;

    if (previousStatus !== finalStatus) {
      try {
        const mailResult =
          await sendOrderEmail(order, 'status');

        emailSent = true;

        console.log(
          'Order status update email accepted:',
          order.customerEmail,
          'Order:',
          order.orderId,
          'Status:',
          finalStatus,
          'Message ID:',
          mailResult.messageId
        );
      } catch (mailError) {
        emailSent = false;
        emailError = mailError.message;

        console.error(
          'Order status update email error:',
          mailError
        );
      }
    } else {
      emailError = 'Status was not changed. No update email was sent.';
    }

    return res.status(200).json({
      success: true,
      message: previousStatus !== finalStatus
        ? emailSent
          ? 'Order status updated successfully. Customer email has been sent.'
          : 'Order status updated successfully, but customer email could not be sent.'
        : 'Order status is unchanged.',
      emailSent,
      ...(emailError ? { emailError } : {}),
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
};

// ==============================
// CANCEL ORDER
// ==============================
exports.cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'Admin';

    const orderUserId = order.userId ? order.userId.toString() : '';
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isAdmin && orderUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to cancel this order'
      });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        error: 'Delivered order cannot be cancelled'
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Order is already cancelled'
      });
    }

    const reason = req.body?.reason || 'Order cancelled by customer';

    order.status = 'Cancelled';

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }

    order.timeline.push({
      status: 'Cancelled',
      date: new Date().toLocaleString(),
      remarks: reason,
      adminName: isAdmin
        ? req.user?.name || req.user?.email || 'Admin'
        : 'Customer'
    });

    if (order.tracking) {
      if (!Array.isArray(order.tracking.trackingHistory)) {
        order.tracking.trackingHistory = [];
      }

      order.tracking.trackingHistory.push({
        status: 'Cancelled',
        location: order.tracking.currentLocation || 'Processing Center',
        date: new Date().toLocaleString(),
        time: new Date().toLocaleTimeString()
      });
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.userId}`).emit('order-cancelled', order);
      io.to('admin-room').emit('order-cancelled', order);
    }

    // ==================================================
    // SEND CANCELLATION EMAIL
    // ==================================================
    let emailSent = false;
    let emailError = null;

    try {
      await sendOrderEmail(order, 'status');
      emailSent = true;
    } catch (mailError) {
      emailError = mailError.message;
      console.error('Order cancellation email error:', mailError);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? 'Order cancelled successfully. Customer email has been sent.'
        : 'Order cancelled successfully, but customer email could not be sent.',
      emailSent,
      ...(emailError ? { emailError } : {}),
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
};

// ==============================
// RETURN ORDER
// ==============================
exports.returnOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'Admin';

    const orderUserId = order.userId ? order.userId.toString() : '';
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isAdmin && orderUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to return this order'
      });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        error: 'Only delivered orders can be returned'
      });
    }

    const reason = req.body?.reason || 'Return requested by customer';

    order.status = 'Returned';

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }

    order.timeline.push({
      status: 'Returned',
      date: new Date().toLocaleString(),
      remarks: reason,
      adminName: isAdmin
        ? req.user?.name || req.user?.email || 'Admin'
        : 'Customer'
    });

    if (order.tracking) {
      if (!Array.isArray(order.tracking.trackingHistory)) {
        order.tracking.trackingHistory = [];
      }

      order.tracking.trackingHistory.push({
        status: 'Returned',
        location: order.tracking.currentLocation || 'Processing Center',
        date: new Date().toLocaleString(),
        time: new Date().toLocaleTimeString()
      });
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.userId}`).emit('order-returned', order);
      io.to('admin-room').emit('order-returned', order);
    }

    // ==================================================
    // SEND RETURN EMAIL
    // ==================================================
    let emailSent = false;
    let emailError = null;

    try {
      await sendOrderEmail(order, 'status');
      emailSent = true;
    } catch (mailError) {
      emailError = mailError.message;
      console.error('Order return email error:', mailError);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? 'Order return processed successfully. Customer email has been sent.'
        : 'Order return processed successfully, but customer email could not be sent.',
      emailSent,
      ...(emailError ? { emailError } : {}),
      data: order
    });
  } catch (error) {
    console.error('Return order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to return order'
    });
  }
};

// ==============================
// GET ORDER STATS
// ==============================
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const outForDeliveryOrders = await Order.countDocuments({
      status: { $in: ['Out for Delivery', 'Out For Delivery'] }
    });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    const returnedOrders = await Order.countDocuments({ status: 'Returned' });

    const salesResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: { $ifNull: ['$grandTotal', 0] }
          }
        }
      }
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

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
        cancelledOrders,
        returnedOrders,
        totalSales
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order statistics'
    });
  }
};

// ==============================
// EXPORTS
// ==============================
module.exports = {
  createOrder: exports.createOrder,
  getAllOrders: exports.getAllOrders,
  getOrderById: exports.getOrderById,
  updateOrderStatus: exports.updateOrderStatus,
  cancelOrder: exports.cancelOrder,
  returnOrder: exports.returnOrder,
  getOrderStats: exports.getOrderStats
};
