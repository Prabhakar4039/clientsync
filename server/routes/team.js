const express = require('express');
const {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTeamMembers)
  .post(authorize('Admin'), createTeamMember);

router
  .route('/:id')
  .put(authorize('Admin'), updateTeamMember)
  .delete(authorize('Admin'), deleteTeamMember);

module.exports = router;
