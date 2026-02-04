# Development Instructions

## Project Setup

### Prerequisites
1. **Install Required Software**:
   - Python (>= 3.9)
   - Node.js (>= 16)
   - Docker and Docker Compose
   - Git
2. **Clone the Repository**:
   ```bash
   git clone git@github.com:A2Popov/Multichat.git
   cd Multichat
   ```

## Backend Development

### Setup Python Backend
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn backend.app.main:app --reload
   ```
4. OpenAPI docs available at: `http://localhost:8000/docs`

### Notes
- Database: SQLite (default).
- To apply migrations (TBD): `alembic upgrade head` (if using Alembic).

---

## Frontend Development

### Setup React Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
4. Access the application at: `http://localhost:3000`

---

## Docker Compose

### Run Full Application
1. Build and start all services:
   ```bash
   docker-compose up --build
   ```
2. Access the services at their specified ports:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

3. Stop services:
   ```bash
   docker-compose down
   ```

---

## Contribution
1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
3. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Create a pull request on GitHub.

---

## Notes
- Ensure code conforms to project style guides (e.g., Prettier, PEP8).
- PRs require review before merging.
- Follow the roadmap in `project_plan.md`.

---