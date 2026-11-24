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
// EMAIL CONFIGURATION
// ======================================================

const getMailTransporter = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error('SMTP email credentials missing.');
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' ||
    port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user, pass }
  });
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));

const getOrderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<tr><td colspan="4">Order item details are not available.</td></tr>';
  }

  return items.map((item) => {
    const name =
      item.productName ||
      item.name ||
      item.title ||
      item.product?.name ||
      item.product?.title ||
      'Product';

    const quantity = Number(item.quantity || item.qty || 1);
    const price = Number(item.price || item.unitPrice || item.sellingPrice || 0);
    const total = Number(item.total || item.itemTotal || price * quantity);

    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td>
        <td style="padding:10px;text-align:center;">${quantity}</td>
        <td style="padding:10px;text-align:right;">₹${price.toFixed(2)}</td>
        <td style="padding:10px;text-align:right;">₹${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
};

// ======================================================
// SEND ORDER EMAIL
// ======================================================

const sendOrderEmail = async (order, eventType, status = '') => {
  try {
    const recipient = String(order?.customerEmail || '').trim();

    if (!recipient || recipient === 'user@example.com') {
      console.error('Customer email missing or invalid.');
      return false;
    }

    const transporter = getMailTransporter();
    if (!transporter) return false;

    const from =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER;

    const orderId = escapeHtml(order.orderId || '');
    const customerName = escapeHtml(order.customerName || 'Customer');
    const currentStatus = escapeHtml(status || order.status || 'Pending');
    const total = Number(order.grandTotal || 0).toFixed(2);

    let heading = 'Your order has been received!';
    let message = 'Thank you for shopping with Vani Systems. Your order has been placed successfully.';

    if (eventType === 'status') {
      if (status === 'Delivered') {
        heading = 'Your order has been delivered successfully!';
        message = 'Your order has been delivered successfully. Thank you for shopping with Vani Systems.';
      } else if (status === 'Shipped') {
        heading = 'Your order has been shipped!';
        message = 'Your order is on its way.';
      } else if (status === 'Out for Delivery') {
        heading = 'Your order is out for delivery!';
        message = 'Your order should reach you soon.';
      } else if (status === 'Confirmed') {
        heading = 'Your order has been confirmed!';
        message = 'The admin has confirmed your order.';
      } else if (status === 'Processing') {
        heading = 'Your order is being processed!';
        message = 'Your order is now being prepared.';
      } else {
        heading = `Your order status is now ${status}.`;
        message = `The latest status of your order is ${status}.`;
      }
    } else if (eventType === 'cancelled') {
      heading = 'Your order has been cancelled.';
      message = 'Your order cancellation has been recorded.';
    } else if (eventType === 'returned') {
      heading = 'Your return has been recorded.';
      message = 'Your order return has been recorded successfully.';
    }

    const subjectByEvent = {
      placed: `Order Confirmed - ${order.orderId}`,
      status: `Order Update: ${status} - ${order.orderId}`,
      cancelled: `Order Cancelled - ${order.orderId}`,
      returned: `Return Update - ${order.orderId}`
    };

    const itemsHtml = getOrderItemsHtml(order.items);

    const html = `
      <div style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,sans-serif;color:#222;">
        <div style="max-width:680px;margin:auto;background:#fff;border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;">
          <div style="padding:22px;background:#10233f;color:#fff;">
            <h2>Vani Systems Pvt. Ltd.</h2>
            <p>Order Notification</p>
          </div>
          <div style="padding:24px;">
            <p>Hello ${customerName},</p>
            <h2 style="color:#16865b;">${escapeHtml(heading)}</h2>
            <p>${escapeHtml(message)}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Status:</strong> ${currentStatus}</p>
            <p><strong>Invoice Number:</strong> ${escapeHtml(order.invoiceNumber || 'N/A')}</p>
            <p><strong>Tracking Number:</strong> ${escapeHtml(order.trackingNumber || 'N/A')}</p>

            <h3>Order Details</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f1f3f5;">
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <h3 style="text-align:right;">Grand Total: ₹${total}</h3>
            <p><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'N/A')}</p>
            <p><strong>Payment Status:</strong> ${escapeHtml(order.paymentStatus || 'N/A')}</p>
            <p>Thank you,<br/>Vani Systems Pvt. Ltd.</p>
          </div>
        </div>
      </div>
    `;

    const text = [
      `Hello ${order.customerName || 'Customer'},`,
      heading,
      message,
      `Order ID: ${order.orderId || ''}`,
      `Status: ${status || order.status || 'Pending'}`,
      `Invoice: ${order.invoiceNumber || 'N/A'}`,
      `Tracking: ${order.trackingNumber || 'N/A'}`,
      `Grand Total: Rs. ${total}`,
      'Vani Systems Pvt. Ltd.'
    ].join('\n');

    await transporter.sendMail({
      from: from ? `"Vani Systems" <${from}>` : undefined,
      to: recipient,
      subject: subjectByEvent[eventType] || `Order Update - ${order.orderId}`,
      text,
      html
    });

    console.log(`Order email sent: ${eventType} | ${order.orderId}`);
    return true;

  } catch (error) {
    console.error('Order email sending failed:', error.message);
    return false;
  }
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

// ==========================================
// CREATE AND SEND NOTIFICATION
// ==========================================

const createAndSendNotification = async (app, data) => {
  try {
    const notificationController = require("./notificationController");

    if (
      notificationController &&
      typeof notificationController.createNotification === "function"
    ) {
      await notificationController.createNotification({
        body: data,
      });
    }
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

// ==========================================
// CREATE ORDER
// ==========================================

exports.createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order",
      });
    }

    const targetEmail =
      req.user?.email ||
      req.body.customerEmail ||
      "user@example.com";

    const targetName =
      req.user?.name ||
      req.body.customerName ||
      "Customer";

    const targetPhone =
      req.user?.phone ||
      req.body.customerPhone ||
      "";

    const orderData = {
      ...req.body,

      orderId: generateOrderId(),
      invoiceNumber: generateInvoiceNumber(),
      trackingNumber: generateTrackingNumber(),

      userId: req.user._id || req.user.id,

      customerName: targetName,
      customerEmail: targetEmail,
      customerPhone: targetPhone,

      paymentStatus:
        req.body.paymentMethod === "Cash On Delivery"
          ? "Pending"
          : "Paid",

      status: "Pending",

      timeline: [
        {
          status: "Pending",
          message: "Order placed successfully",
          date: new Date(),
        },
      ],

      trackingHistory: [
        {
          status: "Pending",
          location: "Order Placed",
          message: "Your order has been placed successfully",
          date: new Date(),
        },
      ],
    };

    const order = await Order.create(orderData);

    // ==========================================
    // SEND ORDER CONFIRMATION EMAIL
    // ==========================================

    await sendOrderEmail(order, "placed", "Pending");

    // ==========================================
    // SOCKET.IO NEW ORDER EVENT
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("new-order", order);
    }

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    await createAndSendNotification(req.app, {
      title: "New Order Received",
      message: `New order ${order.orderId} has been placed`,
      type: "order",
      orderId: order._id,
      userId: order.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL ORDERS
// ==========================================

exports.getAllOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    let orders;

    if (
      req.user.role === "admin" ||
      req.user.role === "Admin"
    ) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      orders = await Order.find({
        userId: req.user._id || req.user.id,
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ==========================================
// GET ORDER BY ID
// ==========================================

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const order = await Order.findOne({
      orderId: req.params.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "Admin";

    const currentUserId = String(
      req.user._id || req.user.id
    );

    const orderUserId = String(order.userId);

    if (!isAdmin && currentUserId !== orderUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

exports.updateOrderStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const {
      status,
      message,
      location,
    } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    const normalizedStatus = allowedStatuses.find(
      (item) =>
        item.toLowerCase() ===
        String(status || "").trim().toLowerCase()
    );

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check whether status actually changed.
    const statusChanged =
      order.status !== normalizedStatus;

    if (!statusChanged) {
      return res.status(200).json({
        success: true,
        message: "Order already has this status",
        order,
      });
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    order.status = normalizedStatus;

    // ==========================================
    // UPDATE TIMELINE
    // ==========================================

    if (!order.timeline) {
      order.timeline = [];
    }

    order.timeline.push({
      status: normalizedStatus,
      message:
        message ||
        `Order status updated to ${normalizedStatus}`,
      date: new Date(),
    });

    // ==========================================
    // UPDATE TRACKING HISTORY
    // ==========================================

    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      status: normalizedStatus,
      location: location || "",
      message:
        message ||
        `Your order is now ${normalizedStatus}`,
      date: new Date(),
    });

    await order.save();

    // ==========================================
    // SEND CUSTOMER STATUS EMAIL
    // ==========================================

    if (statusChanged) {
      let eventType = "status";

      if (normalizedStatus === "Cancelled") {
        eventType = "cancelled";
      } else if (normalizedStatus === "Returned") {
        eventType = "returned";
      }

      await sendOrderEmail(
        order,
        eventType,
        normalizedStatus
      );
    }

    // ==========================================
    // SOCKET.IO EVENTS
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);

      io.to(String(order.userId)).emit(
        "order-status-updated",
        order
      );
    }

    // ==========================================
    // NOTIFICATION
    // ==========================================

    await createAndSendNotification(req.app, {
      title: "Order Status Updated",
      message: `Your order ${order.orderId} is now ${normalizedStatus}`,
      type: "order",
      orderId: order._id,
      userId: order.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};


// ==========================================
// CANCEL ORDER
// ==========================================

exports.cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "Admin";

    const currentUserId = String(
      req.user._id || req.user.id
    );

    const orderUserId = String(order.userId);

    if (!isAdmin && currentUserId !== orderUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order",
      });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered order cannot be cancelled",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    order.status = "Cancelled";

    if (!order.timeline) {
      order.timeline = [];
    }

    order.timeline.push({
      status: "Cancelled",
      message: "Order cancelled successfully",
      date: new Date(),
    });

    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      status: "Cancelled",
      location: "",
      message: "Your order has been cancelled",
      date: new Date(),
    });

    await order.save();

    // ==========================================
    // SEND CANCELLATION EMAIL
    // ==========================================

    await sendOrderEmail(
      order,
      "cancelled",
      "Cancelled"
    );

    // ==========================================
    // SOCKET.IO EVENTS
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);

      io.to(String(order.userId)).emit(
        "order-status-updated",
        order
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// ==========================================
// RETURN ORDER
// ==========================================

exports.returnOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "Admin";

    const currentUserId = String(
      req.user._id || req.user.id
    );

    const orderUserId = String(order.userId);

    if (!isAdmin && currentUserId !== orderUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to return this order",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    order.status = "Returned";

    if (!order.timeline) {
      order.timeline = [];
    }

    order.timeline.push({
      status: "Returned",
      message: "Return request submitted successfully",
      date: new Date(),
    });

    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      status: "Returned",
      location: "",
      message: "Your order return has been initiated",
      date: new Date(),
    });

    await order.save();

    // ==========================================
    // SEND RETURN EMAIL
    // ==========================================

    await sendOrderEmail(
      order,
      "returned",
      "Returned"
    );

    // ==========================================
    // SOCKET.IO EVENTS
    // ==========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admin-room").emit("order-status-updated", order);

      io.to(String(order.userId)).emit(
        "order-status-updated",
        order
      );
    }

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order,
    });
  } catch (error) {
    console.error("Return Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to return order",
      error: error.message,
    });
  }
};

// ==========================================
// GET ORDER STATS
// ==========================================

exports.getOrderStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "Admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

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

    const deliveredOrders = await Order.countDocuments({
      status: "Delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      status: "Cancelled",
    });

    const returnedOrders = await Order.countDocuments({
      status: "Returned",
    });

    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$grandTotal",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get Order Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createOrder: exports.createOrder,
  getAllOrders: exports.getAllOrders,
  getOrderById: exports.getOrderById,
  updateOrderStatus: exports.updateOrderStatus,
  cancelOrder: exports.cancelOrder,
  returnOrder: exports.returnOrder,
  getOrderStats: exports.getOrderStats,
};




