const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { apply, myApplication, cancel } = require('../controllers/applicationController');

router.use(auth, role('student'));

router.post('/', apply);
router.get('/me', myApplication);
router.delete('/me', cancel);

module.exports = router;