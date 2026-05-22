import express from 'express';
const router = express.Router();

const MOCK_USERS = [
  { id: 1, name: 'ayushi trivedi ayushi trivedi', email: 'ayushi.hackberrysoftech@gmail.com', role: 'Tenant User', status: 'CONFIRMED', enabled: 'True', created: '20-01-2026', updated: '20-01-2026' },
  { id: 2, name: 'Hackberrysoftech Hackberrysoftech', email: 'hackberry123@gmail.com', role: 'Tenant User', status: 'CONFIRMED', enabled: 'True', created: '16-01-2026', updated: '16-01-2026' },
  { id: 3, name: 'Ankur Patel', email: 'info@hackberrysoftech.com', role: 'Tenant Admin', status: 'CONFIRMED', enabled: 'True', created: '23-07-2025', updated: '29-09-2025' },
  { id: 4, name: 'Jalpa Rajpuriya Jalpa Rajpuriya', email: 'jalpa.rajpuriya@hackberrysoftech.in', role: 'Tenant User', status: 'CONFIRMED', enabled: 'True', created: '10-12-2025', updated: '10-12-2025' },
  { id: 9, name: 'Meet Nayak', email: 'meet.nayak@hackberrysoftech.in', role: 'Tenant Admin', status: 'CONFIRMED', enabled: 'True', created: '24-07-2025', updated: '24-07-2025' },
];

// GET /api/users
router.get('/', (req, res) => {
  res.json({
    success: true,
    users: MOCK_USERS
  });
});

// POST /api/users
router.post('/', (req, res) => {
  const newUser = { 
    ...req.body, 
    id: MOCK_USERS.length + 1, 
    status: 'CONFIRMED',
    enabled: 'True',
    created: new Date().toLocaleDateString(),
    updated: new Date().toLocaleDateString()
  };
  MOCK_USERS.push(newUser);
  res.json({ success: true, message: 'User created successfully', user: newUser });
});

// PATCH /api/users/:id/status
router.patch('/:id/status', (req, res) => {
  const user = MOCK_USERS.find(u => u.id === parseInt(req.params.id));
  if (user) {
    user.status = req.body.status;
    user.updated = new Date().toLocaleDateString();
    res.json({ success: true, message: `User ${req.params.id} status updated to ${req.body.status}` });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
});

export default router;
