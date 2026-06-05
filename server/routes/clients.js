const express = require('express');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getClients)
  .post(authorize('Admin', 'Project Manager'), createClient);

router
  .route('/:id')
  .get(getClient)
  .put(authorize('Admin', 'Project Manager'), updateClient)
  .delete(authorize('Admin'), deleteClient);

module.exports = router;
