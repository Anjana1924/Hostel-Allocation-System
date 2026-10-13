const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { myAllocation } = require('../controllers/allocationController');

router.get('/me', auth, role('student'), myAllocation);

module.exports = router;