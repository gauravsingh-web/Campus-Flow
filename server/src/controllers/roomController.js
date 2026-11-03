const Room = require('../models/Room');

const getRooms = async (req, res, next) => {
  try {
    const { type, building, status, minCapacity } = req.query;

    const query = {};
    if (type) query.type = type;
    if (building) query.building = { $regex: building, $options: 'i' };
    if (status) query.status = status;
    if (minCapacity) query.capacity = { $gte: parseInt(minCapacity, 10) };

    const rooms = await Room.find(query).sort({ building: 1, roomId: 1 });

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (err) {
    next(err);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (err) {
    next(err);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { roomId, name, type, building, capacity, facilities, status } = req.body;

    if (!roomId || !name || !type || !building || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, name, type, building, and capacity are required.',
      });
    }

    const existing = await Room.findOne({ roomId: roomId.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Room with code ${roomId.toUpperCase()} already exists.`,
      });
    }

    const room = new Room({
      roomId: roomId.toUpperCase(),
      name,
      type,
      building,
      capacity: parseInt(capacity, 10),
      facilities: Array.isArray(facilities)
        ? facilities
        : typeof facilities === 'string'
        ? facilities.split(',').map((f) => f.trim())
        : ['Projector'],
      status: status || 'Available',
    });

    await room.save();

    return res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      room,
    });
  } catch (err) {
    next(err);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room details updated.',
      room,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
};
