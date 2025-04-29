// Mock Database
let mockDB = {
  rooms: [],
  currentUser: null
};

// Load data from localStorage if available
function loadFromStorage() {
  const storedRooms = localStorage.getItem('htmx-chat-rooms');
  if (storedRooms) {
    try {
      mockDB.rooms = JSON.parse(storedRooms);
    } catch (e) {
      console.error('Error parsing stored rooms:', e);
    }
  }
  
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      mockDB.currentUser = userObj.username;
      renderUserState();
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('currentUser');
    }
  }
}

// Save data to localStorage
function saveToStorage() {
  localStorage.setItem('htmx-chat-rooms', JSON.stringify(mockDB.rooms));
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
    // Create HTML for logged-in state
    const html = `
      <div class="flex items-center justify-between">
        <div>
          <span class="font-medium">Logged in as: </span>
          <span class="text-indigo-600 font-semibold" id="current-username">${mockDB.currentUser}</span>
        </div>
        <button 
          hx-post="/api/logout" 
          hx-trigger="click" 
          hx-target="#user-section"
          class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition duration-200 ease-in-out">
          Logout
        </button>
      </div>
    `;
    
    // Replace content and show create room section
    userSection.innerHTML = html;
    createRoomSection.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    
    // Load rooms from server
    fetchRooms();
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

// Fetch rooms from server
function fetchRooms() {
  // Show loading state
  const roomsList = document.getElementById('rooms-list');
  roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">Loading chat rooms...</div>';
  
  // Instead of simulating an API call, perform a real fetch
  fetch('/api/rooms', {
    headers: {
      'X-Client-Rooms': getBase64EncodedRooms()
    }
  })
    .then(response => {
      // Store rooms data from server response header
      const serverRooms = response.headers.get('X-Server-Rooms');
      if (serverRooms) {
        try {
          const decodedRooms = JSON.parse(atob(serverRooms));
          if (Array.isArray(decodedRooms) && decodedRooms.length > 0) {
            mockDB.rooms = decodedRooms;
            saveToStorage();
          }
        } catch (e) {
          console.error('Error processing server rooms:', e);
        }
      }
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(html => {
      if (html && html.trim() !== '') {
        roomsList.innerHTML = html;
      } else {
        roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">No chat rooms available. Create one!</div>';
      }
    })
    .catch(error => {
      console.error('Error fetching rooms:', error);
      roomsList.innerHTML = '<div class="p-6 text-center text-gray-500">Error loading chat rooms. Please try again.</div>';
    });
}

// Get the base64 encoded rooms for sending to the server
function getBase64EncodedRooms() {
  return btoa(JSON.stringify(mockDB.rooms));
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
  
  // Only add custom event handlers if we're in development mode
  // (when real API endpoints aren't available)
  const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevMode) {
    setupMockEventHandlers();
  } else {
    setupRealEventHandlers();
  }
  
  // If user is logged in, setup auth headers for API calls
  if (mockDB.currentUser) {
    const createRoomSection = document.getElementById('create-room-section');
    const searchSection = document.getElementById('search-section');
    createRoomSection.classList.remove('hidden');
    searchSection.classList.remove('hidden');
  }
}

// Setup real event handlers for production environment
function setupRealEventHandlers() {
  // When login is complete
  document.body.addEventListener('htmx:afterOnLoad', function(event) {
    if (event.detail.pathInfo.requestPath === '/api/login' && event.detail.xhr.status === 200) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          mockDB.currentUser = user.username;
          
          // Add authorization header to future requests
          htmx.config.headers = htmx.config.headers || {};
          htmx.config.headers['Authorization'] = `Bearer ${btoa(JSON.stringify({ username: user.username }))}`;
          
          // Add rooms data header to requests
          htmx.config.headers['X-Client-Rooms'] = getBase64EncodedRooms();
          
          // Setup initial room loading
          fetchRooms();
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    // When a new room is created or updated
    if ((event.detail.pathInfo.requestPath === '/api/rooms' && event.detail.xhr.status === 201) ||
        (event.detail.pathInfo.requestPath.match(/^\/api\/rooms\/\d+$/) && event.detail.xhr.status === 200)) {
      // Check for server room data in response headers
      const serverRooms = event.detail.xhr.getResponseHeader('X-Server-Rooms');
      if (serverRooms) {
        try {
          const decodedRooms = JSON.parse(atob(serverRooms));
          if (Array.isArray(decodedRooms)) {
            mockDB.rooms = decodedRooms;
            saveToStorage();
          }
        } catch (e) {
          console.error('Error processing server rooms:', e);
        }
      }
    }
  });
  
  // When logout happens
  document.body.addEventListener('htmx:afterOnLoad', function(event) {
    if (event.detail.pathInfo.requestPath === '/api/logout' && event.detail.xhr.status === 200) {
      mockDB.currentUser = null;
      mockDB.rooms = [];
      saveToStorage();
      
      // Remove authorization header
      if (htmx.config.headers) {
        if (htmx.config.headers['Authorization']) {
          delete htmx.config.headers['Authorization'];
        }
        if (htmx.config.headers['X-Client-Rooms']) {
          delete htmx.config.headers['X-Client-Rooms'];
        }
      }
    }
  });
  
  // Add auth header and rooms data to all HTMX requests if user is logged in
  document.body.addEventListener('htmx:configRequest', function(event) {
    const userJson = localStorage.getItem('currentUser');
    if (userJson && event.detail && event.detail.headers) {
      try {
        const user = JSON.parse(userJson);
        event.detail.headers['Authorization'] = `Bearer ${btoa(JSON.stringify({ username: user.username }))}`;
        event.detail.headers['X-Client-Rooms'] = getBase64EncodedRooms();
      } catch (e) {
        console.error('Error adding auth header:', e);
      }
    }
  });
}

// Setup event handlers for local development
function setupMockEventHandlers() {
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

// Check login status when page loads and restore session if needed
window.addEventListener('load', function() {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      mockDB.currentUser = user.username;
      
      // Render user state
      const userSection = document.getElementById('user-section');
      userSection.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">Logged in as: </span>
            <span class="text-indigo-600 font-semibold" id="current-username">${user.username}</span>
          </div>
          <button 
            hx-post="/api/logout" 
            hx-trigger="click" 
            hx-target="#user-section"
            class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition duration-200 ease-in-out">
            Logout
          </button>
        </div>
      `;
      
      // Show relevant sections
      const createRoomSection = document.getElementById('create-room-section');
      const searchSection = document.getElementById('search-section');
      createRoomSection.classList.remove('hidden');
      searchSection.classList.remove('hidden');
      
      // Add authorization header to HTMX requests
      htmx.config.headers = htmx.config.headers || {};
      htmx.config.headers['Authorization'] = `Bearer ${btoa(JSON.stringify({ username: user.username }))}`;
      
      // Add rooms data to HTMX requests
      htmx.config.headers['X-Client-Rooms'] = getBase64EncodedRooms();
      
      // Load rooms
      fetchRooms();
    } catch (e) {
      console.error('Error restoring session:', e);
      localStorage.removeItem('currentUser');
    }
  }
});