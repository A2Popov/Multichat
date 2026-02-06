# MultiChat

A web application providing access to multiple AI models (OpenAI, Gemini, Claude, etc.) through a single interface.

## Features

- 🔐 JWT-based authentication
- 💬 Chat interface with multiple AI models
- 👥 User management (admin panel)
- 💰 Usage tracking and billing
- 🐳 Docker support

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, Vite, TailwindCSS
- **Authentication**: JWT tokens
- **AI Integration**: OpenAI API (with support for more models)

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone git@github.com:A2Popov/Multichat.git
   cd Multichat
   ```

2. Create `.env` file in the root directory:
   ```bash
   SECRET_KEY=your-random-secret-key
   OPENAI_API_KEY=your-openai-api-key
   ```

3. Start services:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend

1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` file in backend directory (copy from `.env.example`)

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

## Initial Setup

### Create Admin User

After starting the backend, you need to create an admin user manually in the database or use Python:

```python
from app.database import SessionLocal, init_db
from app.models.user import User
from app.auth import get_password_hash

init_db()
db = SessionLocal()

admin = User(
    username="admin",
    email="admin@example.com",
    hashed_password=get_password_hash("admin123"),
    is_admin=True,
    balance=100.0
)

db.add(admin)
db.commit()
db.close()
```

Or run the initialization script (if provided).

## Usage

1. **Login**: Use the credentials you created
2. **Create Users**: Admin can create new users in the Admin Panel
3. **Start Chatting**: Select a model and start chatting
4. **Manage Balance**: Admin can adjust user balances

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Chat
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions` - Create new session
- `GET /api/chat/sessions/{id}/messages` - Get messages
- `POST /api/chat/sessions/{id}/messages` - Send message
- `DELETE /api/chat/sessions/{id}` - Delete session

## Configuration

Environment variables (`.env`):

```env
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=sqlite:///./multichat.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DEBUG=True
```

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.

## Project Structure

```
multichat/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── schemas.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── DEVELOPMENT.md
├── project_plan.md
└── README.md
```

## Contributing

1. Create a new branch
2. Make your changes
3. Submit a pull request

## License

MIT License
