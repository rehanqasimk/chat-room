// Import the shared rooms data and helpers
import { rooms, getUserFromRequest } from './data.js';

export default function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getRooms(req, res);
    case 'POST':
      return createRoom(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET - List all rooms
function getRooms(req, res) {
  try {
    const roomsHtml = rooms.map(room => generateRoomHtml(room, getUserFromRequest(req))).join('');
    
    if (roomsHtml) {
      return res.status(200).send(roomsHtml);
    } else {
      return res.status(200).send('<div class="p-6 text-center text-gray-500">No chat rooms available</div>');
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new room
function createRoom(req, res) {
  try {
    const { roomName, category, capacity } = req.body;
    
    // Validate inputs
    if (!roomName || roomName.trim() === '') {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // Get current user from auth header
    const creator = getUserFromRequest(req) || "anonymous";
    
    // Create a new room
    const newRoom = {
      id: Date.now().toString(),
      name: roomName.trim(),
      category: category || 'general',
      capacity: capacity ? parseInt(capacity) : null,
      status: 'active',
      creator,
      createdAt: new Date().toISOString(),
      participants: 0
    };
    
    // Add to our in-memory database
    rooms.push(newRoom);
    
    // Return HTML for the new room
    const roomHtml = generateRoomHtml(newRoom, creator);
    return res.status(201).send(roomHtml);
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to generate room HTML
function generateRoomHtml(room, currentUser) {
  // Set category class based on room category
  const categoryClasses = {
    general: 'bg-gray-100 text-gray-800',
    gaming: 'bg-green-100 text-green-800',
    tech: 'bg-blue-100 text-blue-800',
    social: 'bg-purple-100 text-purple-800'
  };
  
  const categoryClass = categoryClasses[room.category] || categoryClasses.general;
  const isOwner = currentUser === room.creator || room.creator === 'system';
  
  return `
    <div class="room-item p-6 hover:bg-gray-50 transition duration-200 ease-in-out" data-room-id="${room.id}" data-room-creator="${room.creator}">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <div class="flex items-center space-x-3">
            <h3 class="text-lg font-medium room-name">${room.name}</h3>
            <span class="room-category px-2 py-1 text-xs rounded-full ${categoryClass}">${room.category}</span>
            <span class="room-status px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">${room.status}</span>
          </div>
          <div class="text-sm text-gray-500">
            <span>Created by <span class="room-creator font-medium">${room.creator}</span></span>
            <span class="mx-2">•</span>
            <span class="room-capacity">${room.capacity ? `Max ${room.capacity} participants` : 'Unlimited participants'}</span>
          </div>
        </div>
        <div class="room-actions ${isOwner ? '' : 'hidden'} space-x-2">
          <button 
            class="edit-btn px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition duration-200 ease-in-out"
            hx-get="/api/rooms/${room.id}/edit"
            hx-target="closest .room-item"
            hx-swap="outerHTML">
            Edit
          </button>
          <button 
            class="delete-btn px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition duration-200 ease-in-out"
            hx-delete="/api/rooms/${room.id}"
            hx-confirm="Are you sure you want to delete this room?"
            hx-target="closest .room-item"
            hx-swap="outerHTML">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
}