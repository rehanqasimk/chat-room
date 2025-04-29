// Simple in-memory database for rooms
// In a real application, this would be replaced with a database connection
export const rooms = [
  {
    id: '1',
    name: 'General Chat',
    category: 'general',
    capacity: 50,
    status: 'active',
    creator: 'system',
    createdAt: new Date().toISOString(),
    participants: 0
  },
  {
    id: '2',
    name: 'Gaming Discussion',
    category: 'gaming',
    capacity: 20,
    status: 'active',
    creator: 'system',
    createdAt: new Date().toISOString(),
    participants: 0
  }
];

// Helper function to get user from request
export function getUserFromRequest(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userData = JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
      return userData.username || null;
    }
  } catch (err) {
    console.error('Error parsing auth data:', err);
  }
  return null;
}