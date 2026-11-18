
const mongoose = require('mongoose');
const Address = require('../models/Address');

// ==================== COMMON USER ID HELPER ====================
const getUserId = (req) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return userId;
};

// ==================== COMMON ERROR HANDLER ====================
const handleAddressError = (res, error, action) => {
  console.error(`${action} FULL ERROR:`, {
    message: error.message,
    name: error.name,
    stack: error.stack
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid address ID or data'
    });
  }

  return res.status(500).json({
    success: false,
    error: `${action} failed. Please try again.`
  });
};

// ==================== GET ALL ADDRESSES ====================
exports.getAllAddresses = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const addresses = await Address.find({
      userId
    }).sort({
      isDefault: -1,
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      data: {
        addresses
      }
    });

  } catch (error) {
    return handleAddressError(res, error, 'Get addresses');
  }
};

// ==================== CREATE ADDRESS ====================
exports.createAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const {
      type,
      fullName,
      phone,
      pincode,
      address,
      city,
      state,
      isDefault
    } = req.body || {};

    // Required field validation
    if (
      !fullName ||
      !phone ||
      !pincode ||
      !address ||
      !city ||
      !state
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required address fields'
      });
    }

    if (!/^[0-9]{10}$/.test(String(phone).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit phone number'
      });
    }

    if (!['home', 'office', 'other'].includes(type || 'home')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address type'
      });
    }

    // If new address is default, remove old default
    if (isDefault === true) {
      await Address.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = await Address.create({
      userId,
      type: type || 'home',
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      pincode: String(pincode).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      isDefault: isDefault === true
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        address: newAddress
      }
    });

  } catch (error) {
    return handleAddressError(res, error, 'Add address');
  }
};

// ==================== UPDATE ADDRESS ====================
exports.updateAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address ID'
      });
    }

    const existingAddress = await Address.findOne({
      _id: addressId,
      userId
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    const {
      type,
      fullName,
      phone,
      pincode,
      address,
      city,
      state,
      isDefault
    } = req.body || {};

    // Validate supplied fields only
    if (phone !== undefined && !/^[0-9]{10}$/.test(String(phone).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit phone number'
      });
    }

    if (
      type !== undefined &&
      !['home', 'office', 'other'].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address type'
      });
    }

    // Remove default from other addresses first
    if (isDefault === true) {
      await Address.updateMany(
        {
          userId,
          _id: { $ne: addressId }
        },
        {
          $set: { isDefault: false }
        }
      );
    }

    // Update only supplied fields
    if (type !== undefined) existingAddress.type = type;
    if (fullName !== undefined) existingAddress.fullName = String(fullName).trim();
    if (phone !== undefined) existingAddress.phone = String(phone).trim();
    if (pincode !== undefined) existingAddress.pincode = String(pincode).trim();
    if (address !== undefined) existingAddress.address = String(address).trim();
    if (city !== undefined) existingAddress.city = String(city).trim();
    if (state !== undefined) existingAddress.state = String(state).trim();
    if (isDefault !== undefined) existingAddress.isDefault = isDefault === true;

    await existingAddress.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: existingAddress
      }
    });

  } catch (error) {
    return handleAddressError(res, error, 'Update address');
  }
};

// ==================== DELETE ADDRESS ====================
exports.deleteAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address ID'
      });
    }

    const deletedAddress = await Address.findOneAndDelete({
      _id: addressId,
      userId
    });

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        address: deletedAddress
      }
    });

  } catch (error) {
    return handleAddressError(res, error, 'Delete address');
  }
};

// ==================== SET DEFAULT ADDRESS ====================
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address ID'
      });
    }

    const existingAddress = await Address.findOne({
      _id: addressId,
      userId
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    await Address.updateMany(
      { userId },
      { $set: { isDefault: false } }
    );

    existingAddress.isDefault = true;
    await existingAddress.save();

    return res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: {
        address: existingAddress
      }
    });

  } catch (error) {
    return handleAddressError(res, error, 'Set default address');
  }
};
