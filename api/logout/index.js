export default function handler(req, res) {
  // Only allow POST requests for logout
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return the login form HTML for HTMX to swap
    const html = `
      <div id="login-form">
        <h2 class="text-xl font-semibold mb-4">Enter Your Username</h2>
        <div class="flex space-x-2">
          <input 
            type="text" 
            id="username-input" 
            name="username" 
            placeholder="Username" 
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
          <button 
            hx-post="/api/login" 
            hx-trigger="click" 
            hx-include="#username-input"
            hx-target="#user-section"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 ease-in-out">
            Login
          </button>
        </div>
      </div>
      <script>
        // Hide the create room and search sections after logout
        document.getElementById('search-section').classList.add('hidden');
        document.getElementById('create-room-section').classList.add('hidden');
        
        // Clear user info from localStorage
        localStorage.removeItem('currentUser');
      </script>
    `;
    
    return res.status(200).send(html);
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}