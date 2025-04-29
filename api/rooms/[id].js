// Import the shared rooms data and helpers
import { rooms, getUserFromRequest, updateRoomsFromClient, getRoomsForClient } from "./data.js";

export default function handler(req, res) {
  // Try to update rooms from client state first
  updateRoomsFromClient(req);
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Room ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return getRoom(req, res, id);
    case 'PUT':
      return updateRoom(req, res, id);
    case 'DELETE':
      return deleteRoom(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET - Get a specific room
function getRoom(req, res, id) {
  try {
    const room = rooms.find(r => r.id === id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get current user from auth header
    const currentUser = getUserFromRequest(req);
    
    // Set header with current rooms data for client-side storage
    res.setHeader('X-Server-Rooms', getRoomsForClient());
    
    // Generate HTML for the room
    const roomHtml = generateRoomHtml(room, currentUser);
    return res.status(200).send(roomHtml);
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update a room
function updateRoom(req, res, id) {
  try {
    const roomIndex = rooms.findIndex(r => r.id === id);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get current user from auth header
    const currentUser = getUserFromRequest(req);
    
    // Check if user is authorized to update the room
    if (rooms[roomIndex].creator !== currentUser && rooms[roomIndex].creator !== 'system') {
      return res.status(403).json({ error: 'You can only edit rooms you created' });
    }
    
    const { roomName, category, capacity } = req.body;
    
    // Validate inputs
    if (!roomName || roomName.trim() === '') {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // Update the room
    rooms[roomIndex] = {
      ...rooms[roomIndex],
      name: roomName.trim(),
      category: category || rooms[roomIndex].category,
      capacity: capacity ? parseInt(capacity) : rooms[roomIndex].capacity,
      updatedAt: new Date().toISOString()
    };
    
    // Set header with updated rooms data for client-side storage
    res.setHeader('X-Server-Rooms', getRoomsForClient());
    
    // Generate HTML for the updated room
    const roomHtml = generateRoomHtml(rooms[roomIndex], currentUser);
    return res.status(200).send(roomHtml);
  } catch (error) {
    console.error(`Error updating room ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete a room
function deleteRoom(req, res, id) {
  try {
    const roomIndex = rooms.findIndex(r => r.id === id);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get current user from auth header
    const currentUser = getUserFromRequest(req);
    
    // Check if user is authorized to delete the room
    if (rooms[roomIndex].creator !== currentUser && rooms[roomIndex].creator !== 'system') {
      return res.status(403).json({ error: 'You can only delete rooms you created' });
    }
    
    // Remove the room
    rooms.splice(roomIndex, 1);
    
    // Set header with updated rooms data for client-side storage
    res.setHeader('X-Server-Rooms', getRoomsForClient());
    
    // Return an empty div that will be removed by HTMX
    return res.status(200).send('');
  } catch (error) {
    console.error(`Error deleting room ${id}:`, error);
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