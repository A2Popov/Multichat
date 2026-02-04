# Multichat

Multichat is a web application that provides users with access to various AI models (OpenAI, Gemini, Claude, etc.) through a single unified interface.

## Features

- **Authentication & Authorization**: JWT-based authentication with admin-managed user accounts
- **Multi-Model Support**: Interface for interacting with multiple AI models (draft implementation)
- **Admin Panel**: User management interface for administrators
- **Modern Tech Stack**: FastAPI backend with React frontend
- **Containerized**: Easy deployment with Docker Compose

## Technology Stack

### Backend
- **Python 3.11** with **FastAPI**
- **SQLite** for data storage
- **JWT** for authentication
- **SQLAlchemy** for ORM
- **Passlib** for password hashing

### Frontend
- **React 18** with **Vite**
- **React Router** for navigation
- **Axios** for API requests

### Infrastructure
- **Docker & Docker Compose** for containerization

## Project Structure

```
multichat/
├── backend/            # Server-side application
│   ├── app/           # Main API logic
│   │   ├── main.py    # FastAPI application
│   │   ├── database.py # Database models and setup
│   │   ├── schemas.py  # Pydantic schemas
│   │   └── auth.py     # Authentication logic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # Client-side application
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/ # Reusable components
│   │   └── services/  # API service layer
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- OR Python 3.11+ and Node.js 18+ for local development

### Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone https://github.com/A2Popov/Multichat.git
cd Multichat
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. Default admin credentials:
   - Username: `admin`
   - Password: `admin`

**Important**: Change the default admin password after first login!

### Local Development Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/login` - User login (returns JWT token)
- `GET /api/me` - Get current user information

### User Management (Admin only)
- `POST /api/users` - Create a new user
- `GET /api/users` - List all users

### Chat
- `POST /api/chat` - Send a message to AI (draft implementation)

## Usage

### As an Administrator

1. Log in with admin credentials
2. Navigate to the admin panel (click "Go to Admin" or visit `/admin`)
3. Create new user accounts with username and password
4. Optionally grant admin privileges to users

### As a User

1. Log in with your credentials
2. Select an AI model from the dropdown
3. Type your message and send
4. View the conversation history

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for session management
- Admin routes are protected and require admin privileges
- **Change the SECRET_KEY in `backend/app/auth.py` for production use**
- **Change default admin password immediately**

## Development

### Running Tests

Backend tests (when implemented):
```bash
cd backend
pytest
```

Frontend linting:
```bash
cd frontend
npm run lint
```

### Building for Production

Frontend build:
```bash
cd frontend
npm run build
```

## Roadmap

- [ ] Implement actual AI model integration (OpenAI, Claude, Gemini, etc.)
- [ ] Add usage tracking and billing system
- [ ] Implement conversation history
- [ ] Add user profile management
- [ ] Enhance admin analytics dashboard
- [ ] Add real-time chat with WebSockets
- [ ] Implement rate limiting
- [ ] Add comprehensive test coverage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
