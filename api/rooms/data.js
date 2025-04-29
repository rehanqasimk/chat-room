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
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Gaming Discussion',
    category: 'gaming',
    capacity: 20,
    status: 'active',
    creator: 'system',
    createdAt: new Date().toISOString()
  }
];