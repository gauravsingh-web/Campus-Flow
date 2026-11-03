const LostFoundItem = require('../models/LostFoundItem');
const Notification = require('../models/Notification');
const { lostFoundSchema, claimSchema } = require('../validators/schemas');
const { findPotentialMatches } = require('../services/matchingService');
const { notifyUser, broadcastGlobal } = require('../sockets/socketHandler');

const getItems = async (req, res, next) => {
  try {
    const { reportType, category, status, search, location } = req.query;

    const query = {};

    if (reportType) query.reportType = reportType;
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = { $regex: location, $options: 'i' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await LostFoundItem.find(query)
      .populate('reporter', 'name email role department')
      .populate('claims.claimant', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      items,
    });
  } catch (err) {
    next(err);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('reporter', 'name email role phone department')
      .populate('claims.claimant', 'name email phone department')
      .populate('claims.reviewedBy', 'name role');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost & Found item not found.',
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const validatedData = lostFoundSchema.parse(req.body);

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const item = new LostFoundItem({
      ...validatedData,
      reporter: req.user._id,
      imageUrl,
      status: 'Open',
    });

    await item.save();

    const populated = await LostFoundItem.findById(item._id).populate(
      'reporter',
      'name email role department'
    );

    // Compute automatic matching suggestions immediately
    let matches = [];
    try {
      matches = await findPotentialMatches(item._id);
    } catch (e) {
      console.warn('Match calculation skipped on create:', e.message);
    }

    // Broadcast live notice
    broadcastGlobal('lostfound:new', { item: populated, matchesCount: matches.length });

    return res.status(201).json({
      success: true,
      message: `${item.reportType} item report published successfully.`,
      item: populated,
      potentialMatches: matches.slice(0, 3), // Return top 3 matches immediately
    });
  } catch (err) {
    next(err);
  }
};

const getMatchedItems = async (req, res, next) => {
  try {
    const matches = await findPotentialMatches(req.params.id);

    return res.status(200).json({
      success: true,
      matches,
    });
  } catch (err) {
    next(err);
  }
};

const submitClaim = async (req, res, next) => {
  try {
    const validatedData = claimSchema.parse(req.body);

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    if (item.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot claim an item that you reported.',
      });
    }

    // Check if user already claimed
    const existingClaim = item.claims.find(
      (c) => c.claimant.toString() === req.user._id.toString()
    );
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an ownership claim for this item.',
      });
    }

    item.claims.push({
      claimant: req.user._id,
      proofDescription: validatedData.proofDescription,
      contactPhone: validatedData.contactPhone || req.user.phone || '',
      status: 'Pending',
    });

    await item.save();

    // Notify item reporter
    notifyUser(item.reporter, 'lostfound:claim_received', {
      itemId: item._id,
      title: item.title,
    });

    await Notification.create({
      recipient: item.reporter,
      sender: req.user._id,
      type: 'Claim_Update',
      title: `Claim received on: "${item.title}"`,
      message: `${req.user.name} submitted an ownership claim for the item you reported.`,
      link: `/lost-found`,
    });

    return res.status(200).json({
      success: true,
      message: 'Ownership claim submitted for administrative verification.',
    });
  } catch (err) {
    next(err);
  }
};

const verifyClaim = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Claim status must be either Approved or Rejected.',
      });
    }

    const item = await LostFoundItem.findOne({ 'claims._id': claimId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    const claim = item.claims.id(claimId);
    claim.status = status;
    claim.reviewNotes = reviewNotes || '';
    claim.reviewedBy = req.user._id;

    if (status === 'Approved') {
      item.status = 'Claimed';
    }

    await item.save();

    // Notify claimant
    notifyUser(claim.claimant, 'lostfound:claim_decision', {
      itemId: item._id,
      status,
      title: item.title,
    });

    await Notification.create({
      recipient: claim.claimant,
      sender: req.user._id,
      type: 'Claim_Update',
      title: `Claim ${status}: ${item.title}`,
      message: `Your ownership claim for "${item.title}" was ${status.toLowerCase()} by administration. ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
      link: `/lost-found`,
    });

    return res.status(200).json({
      success: true,
      message: `Claim has been ${status.toLowerCase()}.`,
      item,
    });
  } catch (err) {
    next(err);
  }
};

const updateItemStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Open', 'Claimed', 'Returned', 'Closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.',
      });
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Reporter or Admin can close/return item
    if (item.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change status of this item.',
      });
    }

    item.status = status;
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item marked as ${status}.`,
      item,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  getMatchedItems,
  submitClaim,
  verifyClaim,
  updateItemStatus,
};
