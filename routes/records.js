// routes/records.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getAllRecords, getRecords, addRecord, deleteRecord } = require('../controllers/recordsController');

router.use(auth);

router.get('/all',             getAllRecords);
router.get('/:vehicle',        getRecords);
router.post('/:vehicle',       addRecord);
router.delete('/:vehicle/:id', deleteRecord);

module.exports = router;
