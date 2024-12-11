# Smart Writer Book

A modern document writing application with AI-powered suggestions built using Django REST Framework and Angular.

## Features

- Real-time document editing with Quill rich text editor
- AI-powered writing suggestions
- Document organization with titles and content
- Real-time updates in the sidebar
- Modern, responsive UI

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm 8+
- PostgreSQL 12+

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the backend directory with:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://username:password@localhost:5432/smart_writer_db
OPENAI_API_KEY=your-openai-api-key
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the Django development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `src/environments/environment.ts` file with:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
```

4. Start the Angular development server:
```bash
ng serve
```

The application will be available at `http://localhost:4200`

## Project Structure

```
smart-writer-book/
├── backend/
│   ├── api/
│   │   ├── models/
│   │   ├── serializers/
│   │   ├── views/
│   │   └── urls.py
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── services/
    │   │   └── app.module.ts
    │   └── environments/
    └── angular.json
```

## Development

- Backend API endpoints are available at `http://localhost:8000/api/`
- Frontend development server includes hot-reloading
- API documentation is available at `http://localhost:8000/api/docs/`

## Production Deployment

1. Set environment variables for production
2. Build the frontend:
```bash
cd frontend
ng build --configuration=production
```
3. Configure your web server (nginx/apache) to serve the static files
4. Set up gunicorn or uwsgi for the Django application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.