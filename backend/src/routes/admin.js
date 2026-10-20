const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const admin = require('../controllers/adminController');

router.use(auth, role('admin'));

router.get('/hostels/:id/rooms', admin.hostelRooms);
router.get('/students/unallocated', admin.unallocatedStudents);

router.get('/applications', admin.listApplications);
router.post('/allocate', admin.runAllocation);

router.get('/allocations', admin.listAllocations);
router.post('/allocations/manual', admin.manualAllocation);
router.delete('/allocations/:id', admin.vacateAllocation);

router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

module.exports = router;