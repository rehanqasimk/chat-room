// Simple in-memory database for rooms
// This will be initialized with default rooms but can be updated by requests

// Initial room data
const initialRooms = [
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

// Shared rooms array that will be updated during the lifetime of the serverless function
export let rooms = [...initialRooms];

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

// Helper function to handle room state from the client
export function updateRoomsFromClient(req) {
  try {
    // Get rooms from the client's state if available
    const clientRoomsHeader = req.headers['x-client-rooms'];
    if (clientRoomsHeader) {
      const clientRooms = JSON.parse(Buffer.from(clientRoomsHeader, 'base64').toString());
      
      // Only update if we have valid room data from client
      if (Array.isArray(clientRooms) && clientRooms.length > 0) {
        rooms = clientRooms;
        return true;
      }
    }
  } catch (err) {
    console.error('Error updating rooms from client:', err);
  }
  return false;
}

// Return the current rooms for client-side storage
export function getRoomsForClient() {
  return Buffer.from(JSON.stringify(rooms)).toString('base64');
}