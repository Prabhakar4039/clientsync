const express = require('express');
const {
  getDeliverables,
  createDeliverable,
  reviewDeliverable,
  addFeedback,
} = require('../controllers/deliverableController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDeliverables)
  .post(
    authorize('Admin', 'Project Manager', 'Team Member'),
    upload.single('file'),
    createDeliverable
  );

router.put('/:id/status', reviewDeliverable);
router.post('/:id/feedback', addFeedback);

module.exports = router;
