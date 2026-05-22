import express from 'express';
const router = express.Router();

// Mock User Data
const MOCK_USER = {
  id: "user-admin-001",
  name: "Meet Nayak",
  role: "Super Admin",
  email: "admin@ignito.com"
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@ignito.com' && password === 'admin123') {
    res.json({
      success: true,
      user: MOCK_USER,
      token: "demo-jwt-token-12345"
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }
});

export default router;
