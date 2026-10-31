const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { apply, myApplication, update, cancel } = require('../controllers/applicationController');

router.use(auth, role('student'));

router.post('/', apply);
router.get('/me', myApplication);
router.put('/me', update);
router.delete('/me', cancel);

module.exports = router;