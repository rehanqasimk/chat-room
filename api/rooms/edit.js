// Import the shared rooms data
import { rooms } from './data.js';

export default function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Room ID is required' });
  }
  
  try {
    const room = rooms.find(r => r.id === id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Return the edit form HTML
    const html = `
      <div class="room-item p-6 bg-indigo-50" data-room-id="${room.id}" data-room-creator="${room.creator}">
        <div class="space-y-4">
          <div>
            <label for="edit-room-name" class="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input 
              type="text" 
              id="edit-room-name" 
              name="roomName" 
              value="${room.name}"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
          </div>
          <div>
            <label for="edit-room-category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              id="edit-room-category" 
              name="category"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="general" ${room.category === 'general' ? 'selected' : ''}>General</option>
              <option value="gaming" ${room.category === 'gaming' ? 'selected' : ''}>Gaming</option>
              <option value="tech" ${room.category === 'tech' ? 'selected' : ''}>Technology</option>
              <option value="social" ${room.category === 'social' ? 'selected' : ''}>Social</option>
            </select>
          </div>
          <div>
            <label for="edit-room-capacity" class="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
            <input 
              type="number" 
              id="edit-room-capacity" 
              name="capacity" 
              value="${room.capacity || ''}"
              min="2"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
          </div>
          <div class="flex space-x-2">
            <button 
              hx-put="/api/rooms/${room.id}"
              hx-include="#edit-room-name, #edit-room-category, #edit-room-capacity"
              hx-target="closest .room-item"
              hx-swap="outerHTML"
              class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200 ease-in-out">
              Save
            </button>
            <button 
              hx-get="/api/rooms/${room.id}"
              hx-target="closest .room-item"
              hx-swap="outerHTML"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 ease-in-out">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    return res.status(200).send(html);
  } catch (error) {
    console.error(`Error preparing room edit form for ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}