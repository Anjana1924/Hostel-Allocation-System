const router = require('express').Router();
const auth = require('../middleware/auth');
const { listHostels } = require('../controllers/hostelController');

router.get('/', auth, listHostels);

module.exports = router;