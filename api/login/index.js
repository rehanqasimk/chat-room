export default function handler(req, res) {
  // Only allow POST requests for login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;
    
    // Validate username
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // In a real application, you would handle authentication here
    // For this example, we're just accepting any username

    // Create a basic user profile
    const user = {
      username: username.trim(),
      id: Date.now().toString(),
      loggedInAt: new Date().toISOString()
    };
    
    // Return the logged-in template HTML for HTMX to swap
    const html = `
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
      <script>
        // Show the create room and search sections after login
        document.getElementById('search-section').classList.remove('hidden');
        document.getElementById('create-room-section').classList.remove('hidden');
        
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify(${JSON.stringify(user)}));
        
        // Add authorization header to HTMX requests
        htmx.config.headers = htmx.config.headers || {};
        htmx.config.headers['Authorization'] = 'Bearer ' + btoa(JSON.stringify(${JSON.stringify(user)}));
        
        // Load rooms automatically
        fetch('/api/rooms')
          .then(response => response.text())
          .then(html => {
            document.getElementById('rooms-list').innerHTML = html || '<div class="p-6 text-center text-gray-500">No chat rooms available. Create one!</div>';
          })
          .catch(error => {
            console.error('Error loading rooms:', error);
          });
      </script>
    `;
    
    return res.status(200).send(html);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}