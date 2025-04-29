# HTMX Chat Rooms

A simple chat application that demonstrates CRUD operations on chat rooms using HTMX without full page reloads.

## Features

- Create new chat rooms with unique names
- Edit existing chat rooms (creator only)
- Delete chat rooms (creator only)
- View all available chat rooms
- Simple authentication via username

## Technology Stack

- HTMX for AJAX interactions without JavaScript
- Tailwind CSS for styling
- Vanilla JavaScript for mock backend services
- LocalStorage for data persistence

## Setup and Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/htmx-chat-rooms.git
cd htmx-chat-rooms
```

2. Open the project in your preferred code editor

3. Serve the project using a local development server. You can use any of the following:

   - Using Python:
     ```bash
     python -m http.server
     ```

   - Using Node.js (with `http-server`):
     ```bash
     npm install -g http-server
     http-server
     ```

4. Open your browser and navigate to `http://localhost:8080` (or the port specified by your local server)

## How to Use the Application

1. **Login**: Enter a username to start using the application
2. **Create a Room**: After logging in, you can create a new chat room by entering a name and clicking "Create Room"
3. **Edit a Room**: If you created a room, you can edit its name by clicking the "Edit" button
4. **Delete a Room**: If you created a room, you can delete it by clicking the "Delete" button

## Implementation Details

### HTMX Integration

This application uses HTMX to handle all CRUD operations asynchronously:

- `hx-post` for creating new rooms and logging in
- `hx-put` for updating room information
- `hx-delete` for removing rooms
- `hx-get` for fetching room edit forms and canceling edits
- `hx-target` and `hx-swap` for specifying where to place returned content

### Mock Backend

Since this is a frontend-focused project, the backend is simulated using JavaScript functions that:

1. Intercept HTMX requests to mock API endpoints
2. Process the requests and generate appropriate HTML responses
3. Update the local data store (using localStorage for persistence)

### Design Decisions

1. **Authentication**: A simple username-based authentication was implemented. In a real application, you would use more secure methods.

2. **Data Persistence**: LocalStorage is used to persist data between sessions. In a production application, you would connect to a real database.

3. **Error Handling**: Toast notifications provide feedback to users about the success or failure of operations.

4. **Responsive Design**: The application is designed to work well on both desktop and mobile devices.

## Testing

To test the application:

1. Create multiple users by logging out and logging in with different usernames
2. Create rooms with each user
3. Verify that only the creator can edit and delete their own rooms
4. Test validation (e.g., duplicate room names, empty room names)
5. Check responsive behavior on different screen sizes

## Future Improvements

- Implement actual chat functionality within rooms
- Add user profiles and avatars
- Implement real backend with proper authentication
- Add search and filtering for rooms
- Implement WebSocket support for real-time updates