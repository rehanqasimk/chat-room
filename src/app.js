// Mock Database
let mockDB = {
  rooms: [],
  currentUser: null
};

// Load data from localStorage if available
function loadFromStorage() {
  const storedRooms = localStorage.getItem('htmx-chat-rooms');
  if (storedRooms) {
    mockDB.rooms = JSON.parse(storedRooms);
  }
  const storedUser = localStorage.getItem('htmx-chat-currentUser');
  if (storedUser) {
    mockDB.currentUser = storedUser;
    renderUserState();
  }
}

// Save data to localStorage
function saveToStorage() {
  localStorage.setItem('htmx-chat-rooms', JSON.stringify(mockDB.rooms));
  if (mockDB.currentUser) {
    localStorage.setItem('htmx-chat-currentUser', mockDB.currentUser);
  } else {
    localStorage.removeItem('htmx-chat-currentUser');
  }
}

// Helper function to create a room item from the template
function createRoomElement(room) {
  const template = document.getElementById('room-item-template');
  const clone = document.importNode(template.content, true);
  
  const roomItem = clone.querySelector('.room-item');
  roomItem.dataset.roomId = room.id;
  roomItem.dataset.roomCreator = room.creator;
  roomItem.classList.add('fade-in');
  
  const roomName = roomItem.querySelector('.room-name');
  roomName.textContent = room.name;
  
  const roomCategory = roomItem.querySelector('.room-category');
  roomCategory.textContent = room.category;
  const categoryClasses = getCategoryClasses(room.category).split(' ');
  categoryClasses.forEach(className => roomCategory.classList.add(className));
  
  const roomStatus = roomItem.querySelector('.room-status');
  const isActive = room.lastActivity ? (Date.now() - new Date(room.lastActivity).getTime() < 3600000) : false;
  roomStatus.textContent = isActive ? 'Active' : 'Inactive';
  if (isActive) {
    roomStatus.classList.add('bg-green-100', 'text-green-800');
  } else {
    roomStatus.classList.add('bg-gray-100', 'text-gray-800');
  }
  
  const roomCapacity = roomItem.querySelector('.room-capacity');
  roomCapacity.textContent = room.capacity ? `${room.participants || 0}/${room.capacity} participants` : 'Unlimited capacity';
  
  const roomCreator = roomItem.querySelector('.room-creator');
  roomCreator.textContent = room.creator;
  
  // Show edit/delete buttons only for the room creator
  if (mockDB.currentUser === room.creator) {
    const roomActions = roomItem.querySelector('.room-actions');
    roomActions.classList.remove('hidden');
    
    // Update the button URLs with the room ID
    const editBtn = roomActions.querySelector('.edit-btn');
    editBtn.setAttribute('hx-get', `/api/rooms/${room.id}/edit`);
    
    const deleteBtn = roomActions.querySelector('.delete-btn');
    deleteBtn.setAttribute('hx-delete', `/api/rooms/${room.id}`);
  }
  
  return roomItem;
}

// Helper function to get category classes
function getCategoryClasses(category) {
  const classes = {
    general: 'bg-gray-100 text-gray-800',
    gaming: 'bg-purple-100 text-purple-800',
    tech: 'bg-blue-100 text-blue-800',
    social: 'bg-yellow-100 text-yellow-800'
  };
  return classes[category] || classes.general;
}

// Render user state (logged in or not)
function renderUserState() {
  const userSection = document.getElementById('user-section');
  const createRoomSection = document.getElementById('create-room-section');
  const searchSection = document.getElementById('search-section');
  
  if (mockDB.currentUser) {
    // Use the template for logged-in state
    const template = document.getElementById('logged-in-template');
    const clone = document.importNode(template.content, true);
    
    // Update username
    const usernameElement = clone.getElementById('current-username');
    usernameElement.textContent = mockDB.currentUser;
    
    // Replace content and show create room section
    userSection.innerHTML = '';
    userSection.appendChild(clone);
    createRoomSection.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    
    // Load rooms
    loadRooms();
  } else {
    // Show login form
    userSection.innerHTML = document.getElementById('login-form').outerHTML;
    createRoomSection.classList.add('hidden');
    searchSection.classList.add('hidden');
    
    // Clear rooms list
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">Please login to view chat rooms</div>';
  }
}

// Load all rooms
function loadRooms() {
  const roomsList = document.getElementById('rooms-list');
  roomsList.innerHTML = '';
  
  if (mockDB.rooms.length === 0) {
    roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">No chat rooms available. Create one!</div>';
    return;
  }
  
  mockDB.rooms.forEach(room => {
    const roomElement = createRoomElement(room);
    roomsList.appendChild(roomElement);
  });
}

// Filter rooms by search term and category
function filterRooms(searchTerm = '', category = '') {
  return mockDB.rooms.filter(room => {
    const matchesSearch = searchTerm === '' || 
      room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === '' || room.category === category;
    return matchesSearch && matchesCategory;
  });
}

// Show a toast notification
function showToast(message, type = 'info') {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize the app
function init() {
  loadFromStorage();
  setupEventHandlers();
}

// Setup HTMX event handlers for our mock API
function setupEventHandlers() {
  // Login handler
  htmx.on('htmx:beforeRequest', (event) => {
    if (event.detail.requestConfig.path === '/api/login') {
      const username = document.getElementById('username-input').value.trim();
      if (!username) {
        event.detail.requestConfig.headers['HX-Trigger'] = 'showError';
        showToast('Username cannot be empty', 'error');
        event.preventDefault();
        return;
      }
      
      // Simulate API response
      mockDB.currentUser = username;
      saveToStorage();
      
      // Use setTimeout to simulate network delay
      setTimeout(() => {
        renderUserState();
        showToast(`Welcome, ${username}!`, 'success');
      }, 300);
      
      event.preventDefault();
    }
  });
  
  // Logout handler
  htmx.on('htmx:beforeRequest', (event) => {
    if (event.detail.requestConfig.path === '/api/logout') {
      mockDB.currentUser = null;
      saveToStorage();
      
      // Use setTimeout to simulate network delay
      setTimeout(() => {
        renderUserState();
        showToast('You have been logged out', 'info');
      }, 300);
      
      event.preventDefault();
    }
  });
  
  // Search rooms handler
  htmx.on('htmx:beforeRequest', (event) => {
    if (event.detail.requestConfig.path === '/api/rooms/search') {
      const searchTerm = document.getElementById('room-search').value;
      const category = document.getElementById('category-filter').value;
      
      const filteredRooms = filterRooms(searchTerm, category);
      const roomsList = document.getElementById('rooms-list');
      
      roomsList.innerHTML = '';
      if (filteredRooms.length === 0) {
        roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">No rooms match your search</div>';
      } else {
        filteredRooms.forEach(room => {
          const roomElement = createRoomElement(room);
          roomsList.appendChild(roomElement);
        });
      }
      
      event.preventDefault();
    }
  });
  
  // Filter rooms by category handler
  htmx.on('htmx:beforeRequest', (event) => {
    if (event.detail.requestConfig.path === '/api/rooms/filter') {
      const searchTerm = document.getElementById('room-search').value;
      const category = document.getElementById('category-filter').value;
      
      const filteredRooms = filterRooms(searchTerm, category);
      const roomsList = document.getElementById('rooms-list');
      
      roomsList.innerHTML = '';
      if (filteredRooms.length === 0) {
        roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">No rooms in this category</div>';
      } else {
        filteredRooms.forEach(room => {
          const roomElement = createRoomElement(room);
          roomsList.appendChild(roomElement);
        });
      }
      
      event.preventDefault();
    }
  });
  
  // Create room handler
  htmx.on('htmx:beforeRequest', (event) => {
    if (event.detail.requestConfig.path === '/api/rooms') {
      const roomNameInput = document.getElementById('new-room-name');
      const roomName = roomNameInput.value.trim();
      const category = document.getElementById('room-category').value;
      const capacity = parseInt(document.getElementById('room-capacity').value) || null;
      
      if (!roomName) {
        showToast('Room name cannot be empty', 'error');
        event.preventDefault();
        return;
      }
      
      // Check for duplicate room name
      if (mockDB.rooms.some(room => room.name.toLowerCase() === roomName.toLowerCase())) {
        showToast('A room with this name already exists', 'error');
        event.preventDefault();
        return;
      }
      
      // Create new room
      const newRoom = {
        id: Date.now().toString(),
        name: roomName,
        creator: mockDB.currentUser,
        category: category,
        capacity: capacity,
        participants: 0,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      mockDB.rooms.push(newRoom);
      saveToStorage();
      
      // Clear inputs
      roomNameInput.value = '';
      document.getElementById('room-capacity').value = '';
      
      // Create room element
      const roomElement = createRoomElement(newRoom);
      
      // If no rooms message exists, remove it
      const noRoomsMessage = document.querySelector('#rooms-list .text-center');
      if (noRoomsMessage) {
        document.getElementById('rooms-list').innerHTML = '';
      }
      
      // Append to rooms list
      document.getElementById('rooms-list').appendChild(roomElement);
      showToast('Room created successfully', 'success');
      
      event.preventDefault();
    }
  });
  
  // Get room for editing
  htmx.on('htmx:beforeRequest', (event) => {
    const path = event.detail.requestConfig.path;
    if (path.match(/^\/api\/rooms\/\d+\/edit$/)) {
      const roomId = path.split('/')[3];
      const room = mockDB.rooms.find(r => r.id === roomId);
      
      if (!room) {
        showToast('Room not found', 'error');
        event.preventDefault();
        return;
      }
      
      // Check if user is the creator
      if (room.creator !== mockDB.currentUser) {
        showToast('You can only edit rooms you created', 'error');
        event.preventDefault();
        return;
      }
      
      // Create edit form from template
      const template = document.getElementById('room-edit-template');
      const clone = document.importNode(template.content, true);
      
      // Update form data
      const roomItem = clone.querySelector('.room-item');
      roomItem.dataset.roomId = room.id;
      roomItem.dataset.roomCreator = room.creator;
      
      const nameInput = clone.getElementById('edit-room-name');
      nameInput.value = room.name;
      
      const categorySelect = clone.getElementById('edit-room-category');
      categorySelect.value = room.category;
      
      const capacityInput = clone.getElementById('edit-room-capacity');
      capacityInput.value = room.capacity || '';
      
      // Update form action URLs
      const saveBtn = clone.querySelector('button[hx-put]');
      saveBtn.setAttribute('hx-put', `/api/rooms/${room.id}`);
      
      const cancelBtn = clone.querySelector('button[hx-get]');
      cancelBtn.setAttribute('hx-get', `/api/rooms/${room.id}`);
      
      // Replace the room item with the edit form
      const roomElement = event.detail.target;
      roomElement.parentNode.replaceChild(clone, roomElement);
      
      event.preventDefault();
    }
  });
  
  // Get room (cancel edit)
  htmx.on('htmx:beforeRequest', (event) => {
    const path = event.detail.requestConfig.path;
    if (path.match(/^\/api\/rooms\/\d+$/) && event.detail.verb === 'get') {
      const roomId = path.split('/')[3];
      const room = mockDB.rooms.find(r => r.id === roomId);
      
      if (!room) {
        showToast('Room not found', 'error');
        event.preventDefault();
        return;
      }
      
      // Create room item
      const roomElement = createRoomElement(room);
      
      // Replace the edit form with the room item
      event.detail.target.parentNode.replaceChild(roomElement, event.detail.target);
      
      event.preventDefault();
    }
  });
  
  // Update room
  htmx.on('htmx:beforeRequest', (event) => {
    const path = event.detail.requestConfig.path;
    if (path.match(/^\/api\/rooms\/\d+$/) && event.detail.verb === 'put') {
      const roomId = path.split('/')[3];
      const roomIndex = mockDB.rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex === -1) {
        showToast('Room not found', 'error');
        event.preventDefault();
        return;
      }
      
      const room = mockDB.rooms[roomIndex];
      
      // Check if user is the creator
      if (room.creator !== mockDB.currentUser) {
        showToast('You can only edit rooms you created', 'error');
        event.preventDefault();
        return;
      }
      
      // Get updated values
      const newName = document.getElementById('edit-room-name').value.trim();
      const newCategory = document.getElementById('edit-room-category').value;
      const newCapacity = parseInt(document.getElementById('edit-room-capacity').value) || null;
      
      if (!newName) {
        showToast('Room name cannot be empty', 'error');
        event.preventDefault();
        return;
      }
      
      // Check for duplicate room name (excluding current room)
      if (mockDB.rooms.some(r => r.id !== roomId && r.name.toLowerCase() === newName.toLowerCase())) {
        showToast('A room with this name already exists', 'error');
        event.preventDefault();
        return;
      }
      
      // Update room
      room.name = newName;
      room.category = newCategory;
      room.capacity = newCapacity;
      saveToStorage();
      
      // Create updated room element
      const roomElement = createRoomElement(room);
      
      // Replace the edit form with the updated room item
      event.detail.target.parentNode.replaceChild(roomElement, event.detail.target);
      showToast('Room updated successfully', 'success');
      
      event.preventDefault();
    }
  });
  
  // Delete room
  htmx.on('htmx:beforeRequest', (event) => {
    const path = event.detail.requestConfig.path;
    if (path.match(/^\/api\/rooms\/\d+$/) && event.detail.verb === 'delete') {
      const roomId = path.split('/')[3];
      const roomIndex = mockDB.rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex === -1) {
        showToast('Room not found', 'error');
        event.preventDefault();
        return;
      }
      
      const room = mockDB.rooms[roomIndex];
      
      // Check if user is the creator
      if (room.creator !== mockDB.currentUser) {
        showToast('You can only delete rooms you created', 'error');
        event.preventDefault();
        return;
      }
      
      // Remove room
      mockDB.rooms.splice(roomIndex, 1);
      saveToStorage();
      
      // Remove room element with animation
      const roomElement = event.detail.target;
      roomElement.style.opacity = '0';
      roomElement.style.height = '0';
      roomElement.style.overflow = 'hidden';
      roomElement.style.transition = 'opacity 0.3s ease, height 0.3s ease 0.3s';
      
      setTimeout(() => {
        roomElement.remove();
        
        // Show message if no rooms left
        if (mockDB.rooms.length === 0) {
          document.getElementById('rooms-list').innerHTML = 
            '<div class="p-6 text-center text-gray-500 fade-in">No chat rooms available. Create one!</div>';
        }
      }, 600);
      
      showToast('Room deleted successfully', 'success');
      
      event.preventDefault();
    }
  });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);