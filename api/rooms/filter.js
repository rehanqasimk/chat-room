// Import the shared rooms data and helpers
import { rooms, getUserFromRequest, updateRoomsFromClient, getRoomsForClient } from "./data.js";

export default function handler(req, res) {
  try {
    // Try to update rooms from client state first
    updateRoomsFromClient(req);
    
    const category = req.query.category || '';
    
    // Get current user from auth header
    const currentUser = getUserFromRequest(req);
    
    // Set header with current rooms data for client-side storage
    res.setHeader('X-Server-Rooms', getRoomsForClient());
    
    if (!category || category.trim() === '') {
      // If no category filter, return all rooms
      const allRoomsHtml = rooms.map(room => generateRoomHtml(room, currentUser)).join('');
      
      if (allRoomsHtml) {
        return res.status(200).send(allRoomsHtml);
      } else {
        return res.status(200).send('<div class="p-6 text-center text-gray-500">No chat rooms available</div>');
      }
    }
    
    // Filter rooms by category
    const filteredRooms = rooms.filter(room => room.category === category);
    
    if (filteredRooms.length > 0) {
      const roomsHtml = filteredRooms.map(room => generateRoomHtml(room, currentUser)).join('');
      return res.status(200).send(roomsHtml);
    } else {
      return res.status(200).send('<div class="p-6 text-center text-gray-500">No rooms in this category</div>');
    }
  } catch (error) {
    console.error('Error filtering rooms:', error);
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