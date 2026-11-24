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

const Order = require('../models/Order');
const nodemailer = require('nodemailer');

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
// NOTIFICATION HELPER
// ==========================================

const createAndSendNotification = async (app, data) => {
  try {
    if (!app) return;

    const notificationController = require('./notificationController');

    if (notificationController.createNotification) {
      await notificationController.createNotification({
        body: data
      });
    }
  } catch (error) {
    console.error('Notification Error:', error.message);
  }
};

// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const getMailTransporter = () => {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('Email not configured. Please add SMTP_USER and SMTP_PASS.');
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure:
      String(process.env.SMTP_SECURE).toLowerCase() === 'true' ||
      port === 465,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// ==========================================
// ESCAPE HTML
// ==========================================

const escapeHtml = (value) => {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const characters = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return characters[character];
  });
};

// ==========================================
// ORDER ITEMS HTML
// ==========================================

const getOrderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding:12px;text-align:center;">
          No item details available
        </td>
      </tr>
    `;
  }

  return items.map((item) => {
    const productName =
      item.productName ||
      item.name ||
      item.title ||
      item.product?.name ||
      item.product?.title ||
      'Product';

    const quantity = Number(item.qty || item.quantity || 1);

    const price = Number(
      item.price ||
      item.unitPrice ||
      item.sellingPrice ||
      0
    );

    const total = Number(
      item.total ||
      item.itemTotal ||
      price * quantity
    );

    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eeeeee;">
          ${escapeHtml(productName)}
        </td>

        <td style="padding:10px;border-bottom:1px solid #eeeeee;text-align:center;">
          ${escapeHtml(quantity)}
        </td>

        <td style="padding:10px;border-bottom:1px solid #eeeeee;text-align:right;">
          ₹${price.toFixed(2)}
        </td>

        <td style="padding:10px;border-bottom:1px solid #eeeeee;text-align:right;">
          ₹${total.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');
};

// ==========================================
// SEND ORDER EMAIL
// ==========================================

const sendOrderEmail = async (
  order,
  eventType,
  status = ''
) => {
  try {
    if (!order) return false;

    const customerEmail = order.customerEmail;

    if (
      !customerEmail ||
      customerEmail === 'user@example.com'
    ) {
      console.log('Order email skipped: Customer email not available.');
      return false;
    }

    const transporter = getMailTransporter();

    if (!transporter) {
      return false;
    }

    const emailFrom =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER;

    const orderId = order.orderId || 'N/A';
    const invoiceNumber = order.invoiceNumber || 'N/A';
    const trackingNumber = order.trackingNumber || 'N/A';

    const customerName = order.customerName || 'Customer';

    const orderStatus = status || order.status || 'Pending';

    let heading = 'Order Update';
    let message = 'Your order information has been updated.';
    let subject = 'Vani Systems - Order Update';

    // ------------------------------------------
    // ORDER PLACED
    // ------------------------------------------

    if (eventType === 'placed') {
      heading = 'Order Confirmed';
      message = 'Thank you for shopping with Vani Systems. Your order has been successfully placed.';
      subject = `Vani Systems - Order Confirmed (${orderId})`;
    }

    // ------------------------------------------
    // ORDER STATUS UPDATE
    // ------------------------------------------

    else if (eventType === 'status') {
      heading = 'Order Status Updated';
      message = `Your order status has been updated to ${orderStatus}.`;

      if (orderStatus === 'Delivered') {
        heading = 'Order Delivered';
        message = 'Your order has been successfully delivered. Thank you for shopping with Vani Systems.';
      } else if (orderStatus === 'Shipped') {
        heading = 'Order Shipped';
        message = 'Your order has been shipped and is on its way.';
      } else if (orderStatus === 'Out for Delivery') {
        heading = 'Order Out for Delivery';
        message = 'Your order is out for delivery and will reach you soon.';
      } else if (orderStatus === 'Confirmed') {
        heading = 'Order Confirmed';
        message = 'Your order has been confirmed.';
      } else if (orderStatus === 'Processing') {
        heading = 'Order Processing';
        message = 'Your order is currently being processed.';
      }

      subject = `Vani Systems - ${heading} (${orderId})`;
    }

    // ------------------------------------------
    // ORDER CANCELLED
    // ------------------------------------------

    else if (eventType === 'cancelled') {
      heading = 'Order Cancelled';
      message = 'Your order has been cancelled successfully.';
      subject = `Vani Systems - Order Cancelled (${orderId})`;
    }

    // ------------------------------------------
    // ORDER RETURNED
    // ------------------------------------------

    else if (eventType === 'returned') {
      heading = 'Order Return Updated';
      message = 'Your order return request has been processed.';
      subject = `Vani Systems - Order Return (${orderId})`;
    }

    // ------------------------------------------
    // EMAIL HTML
    // ------------------------------------------

    const itemsHtml = getOrderItemsHtml(order.items);

    const grandTotal = Number(order.grandTotal || 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(heading)}</title>
      </head>

      <body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">

        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;">

          <div style="background:#14213d;padding:25px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:25px;">Vani Systems Pvt. Ltd.</h1>
            <p style="margin:8px 0 0;">Order Notification</p>
          </div>

          <div style="padding:25px;">

            <h2 style="color:#14213d;">
              ${escapeHtml(heading)}
            </h2>

            <p>
              Hello ${escapeHtml(customerName)},
            </p>

            <p style="line-height:1.6;">
              ${escapeHtml(message)}
            </p>

            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin:20px 0;">

              <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>

              <p><strong>Invoice Number:</strong> ${escapeHtml(invoiceNumber)}</p>

              <p><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>

              <p><strong>Order Status:</strong> ${escapeHtml(orderStatus)}</p>

              <p><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'N/A')}</p>

              <p><strong>Payment Status:</strong> ${escapeHtml(order.paymentStatus || 'N/A')}</p>

            </div>

            <h3 style="color:#14213d;">Order Items</h3>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">

              <thead>
                <tr style="background:#f0f0f0;">
                  <th style="padding:10px;text-align:left;">Product</th>
                  <th style="padding:10px;text-align:center;">Qty</th>
                  <th style="padding:10px;text-align:right;">Price</th>
                  <th style="padding:10px;text-align:right;">Total</th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>

            </table>

            <div style="margin-top:20px;text-align:right;">

              <h3>
                Grand Total: ₹${grandTotal.toFixed(2)}
              </h3>

            </div>

            <hr style="border:none;border-top:1px solid #eeeeee;margin:25px 0;">

            <p style="line-height:1.6;">
              Thank you for choosing Vani Systems Pvt. Ltd.
            </p>

            <p>
              Regards,<br>
              <strong>Vani Systems Team</strong>
            </p>

          </div>

          <div style="background:#14213d;padding:15px;text-align:center;color:#ffffff;font-size:12px;">
            © ${new Date().getFullYear()} Vani Systems Pvt. Ltd. All Rights Reserved.
          </div>

        </div>

      </body>
      </html>
    `;

    const text = `
${heading}

Hello ${customerName},

${message}

Order ID: ${orderId}
Invoice Number: ${invoiceNumber}
Tracking Number: ${trackingNumber}
Order Status: ${orderStatus}
Payment Method: ${order.paymentMethod || 'N/A'}
Payment Status: ${order.paymentStatus || 'N/A'}
Grand Total: ₹${grandTotal.toFixed(2)}

Thank you for choosing Vani Systems Pvt. Ltd.
    `;

    await transporter.sendMail({
      from: emailFrom,
      to: customerEmail,
      subject,
      text,
      html
    });

    console.log(`Order email sent successfully to ${customerEmail}`);

    return true;

  } catch (error) {
    console.error('Order Email Error:', error.message);
    return false;
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
        message: 'Please login first'
      });
    }

    const targetEmail =
      req.user?.email ||
      req.body.customerEmail ||
      'user@example.com';

    const targetName =
      req.body.customerName ||
      req.user?.name ||
      'Customer';

    const targetPhone =
      req.body.customerPhone ||
      req.user?.phone ||
      '';

    const orderData = {
      orderId: generateOrderId(),

      invoiceNumber: generateInvoiceNumber(),

      trackingNumber: generateTrackingNumber(),

      userId: req.user._id,

      customerEmail: targetEmail,

      customerName: targetName,

      customerPhone: targetPhone,

      customerAddress: req.body.customerAddress || '',

      city: req.body.city || '',

      pincode: req.body.pincode || '',

      items: req.body.items || [],

      totalItems: req.body.totalItems || 0,

      subtotal: req.body.subtotal || 0,

      shippingCharge: 0,

      tax: 0,

      discount: req.body.discount || 0,

      grandTotal: req.body.grandTotal || 0,

      paymentMethod: req.body.paymentMethod || 'COD',

      paymentStatus:
        req.body.paymentMethod === 'COD'
          ? 'Pending'
          : 'Paid',

      status: 'Pending',

      timeline: [
        {
          status: 'Order Placed',
          date: new Date().toLocaleString(),
          remarks: 'Order successfully placed'
        }
      ],

      tracking: {
        currentLocation: 'Order Placed',

        estimatedDelivery: req.body.estimatedDelivery || null,

        trackingHistory: [
          {
            status: 'Order Placed',
            location: 'Order Placed',
            date: new Date().toLocaleString(),
            remarks: 'Your order has been placed successfully'
          }
        ]
      }
    };

    const order = await Order.create(orderData);

    // ==========================================
    // SEND ORDER CONFIRMATION EMAIL
    // ==========================================

    await sendOrderEmail(order, 'placed', 'Pending');

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const io = req.app.get('io');

    if (io) {
      io.to('admin-room').emit('new-order', order);
    }

    // ==========================================
    // NOTIFICATION
    // ==========================================

    await createAndSendNotification(req.app, {
      userId: req.user._id,

      userEmail: targetEmail,

      title: 'New Order Placed',

      message: `Your order ${order.orderId} has been placed successfully.`,

      type: 'order'
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create Order Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// GET ALL ORDERS
// ==========================================

const getAllOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    let orders;

    if (
      req.user.role === 'admin' ||
      req.user.role === 'Admin'
    ) {
      orders = await Order.find().sort({
        createdAt: -1
      });
    } else {
      orders = await Order.find({
        userId: req.user._id
      }).sort({
        createdAt: -1
      });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: {
        orders
      }
    });

  } catch (error) {
    console.error('Get All Orders Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// GET ORDER BY ID
// ==========================================

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (
      req.user &&
      req.user.role !== 'admin' &&
      req.user.role !== 'Admin' &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get Order By ID Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

const updateOrderStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Order status is required'
      });
    }

    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      'out for delivery': 'Out for Delivery',
      outfordelivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      canceled: 'Cancelled',
      returned: 'Returned'
    };

    const finalStatus =
      statusMap[String(status).toLowerCase().trim()];

    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Returned'
    ];

    if (!finalStatus || !allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findOne({
      orderId: req.params.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Preserve the previous status for email checking.
    const previousStatus = order.status;

    order.status = finalStatus;

    order.timeline.push({
      status: finalStatus,
      date: new Date().toLocaleString(),
      remarks: remarks || `Order status updated to ${finalStatus}`,
      adminName: req.user?.name || 'Admin'
    });

    if (!order.tracking) {
      order.tracking = {
        currentLocation: '',
        estimatedDelivery: null,
        trackingHistory: []
      };
    }

    order.tracking.currentLocation = finalStatus;

    order.tracking.trackingHistory.push({
      status: finalStatus,
      location: order.tracking.currentLocation,
      date: new Date().toLocaleString(),
      remarks: remarks || `Order status updated to ${finalStatus}`
    });

    await order.save();

    // ==========================================
    // SEND STATUS UPDATE EMAIL
    // ==========================================

    if (previousStatus !== finalStatus) {
      if (finalStatus === 'Cancelled') {
        await sendOrderEmail(order, 'cancelled', finalStatus);
      } else if (finalStatus === 'Returned') {
        await sendOrderEmail(order, 'returned', finalStatus);
      } else {
        await sendOrderEmail(order, 'status', finalStatus);
      }
    }

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const io = req.app.get('io');

    if (io) {
      io.to(`user-${order.userId}`).emit('order-status-updated', order);

      io.to('admin-room').emit('order-updated', order);
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update Order Status Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// CANCEL ORDER
// ==========================================

const cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    const order = await Order.findOne({
      orderId: req.params.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'Admin' &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (
      order.status === 'Delivered' ||
      order.status === 'Cancelled'
    ) {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be cancelled'
      });
    }

    const reason =
      req.body.reason ||
      'Order cancelled by customer';

    order.status = 'Cancelled';

    order.timeline.push({
      status: 'Cancelled',
      date: new Date().toLocaleString(),
      remarks: reason,
      adminName: req.user?.name || 'Customer'
    });

    if (order.tracking) {
      order.tracking.currentLocation = 'Cancelled';

      order.tracking.trackingHistory.push({
        status: 'Cancelled',
        location: 'Cancelled',
        date: new Date().toLocaleString(),
        remarks: reason
      });
    }

    await order.save();

    // ==========================================
    // SEND CANCELLATION EMAIL
    // ==========================================

    await sendOrderEmail(order, 'cancelled', 'Cancelled');

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const io = req.app.get('io');

    if (io) {
      io.to(`user-${order.userId}`).emit('order-cancelled', order);

      io.to('admin-room').emit('order-cancelled', order);
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// RETURN ORDER
// ==========================================

const returnOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    const order = await Order.findOne({
      orderId: req.params.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'Admin' &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    const reason =
      req.body.reason ||
      'Return requested by customer';

    order.status = 'Returned';

    order.timeline.push({
      status: 'Returned',
      date: new Date().toLocaleString(),
      remarks: reason,
      adminName: req.user?.name || 'Customer'
    });

    if (order.tracking) {
      order.tracking.currentLocation = 'Returned';

      order.tracking.trackingHistory.push({
        status: 'Returned',
        location: 'Returned',
        date: new Date().toLocaleString(),
        remarks: reason
      });
    }

    await order.save();

    // ==========================================
    // SEND RETURN EMAIL
    // ==========================================

    await sendOrderEmail(order, 'returned', 'Returned');

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const io = req.app.get('io');

    if (io) {
      io.to(`user-${order.userId}`).emit('order-returned', order);

      io.to('admin-room').emit('order-returned', order);
    }

    return res.status(200).json({
      success: true,
      message: 'Order return processed successfully',
      data: order
    });

  } catch (error) {
    console.error('Return Order Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// GET ORDER STATS
// ==========================================

const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: 'Pending'
    });

    const confirmedOrders = await Order.countDocuments({
      status: 'Confirmed'
    });

    const processingOrders = await Order.countDocuments({
      status: 'Processing'
    });

    const shippedOrders = await Order.countDocuments({
      status: 'Shipped'
    });

    const outForDeliveryOrders = await Order.countDocuments({
      status: 'Out for Delivery'
    });

    const deliveredOrders = await Order.countDocuments({
      status: 'Delivered'
    });

    const cancelledOrders = await Order.countDocuments({
      status: 'Cancelled'
    });

    const returnedOrders = await Order.countDocuments({
      status: 'Returned'
    });

    const salesResult = await Order.aggregate([
      {
        $match: {
          status: {
            $ne: 'Cancelled'
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: {
              $ifNull: ['$grandTotal', 0]
            }
          }
        }
      }
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
        cancelledOrders,
        returnedOrders,
        totalSales
      }
    });

  } catch (error) {
    console.error('Get Order Stats Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
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
  getOrderStats
};
