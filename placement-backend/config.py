import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'placement-dashboard-secret-key-2024')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-placement-2024')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/placement_db')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {'pdf'}
