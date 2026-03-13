from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config import Config
import os

app = Flask(__name__)
app.config.from_object(Config)

# CORS - allow React dev server
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

# JWT
jwt = JWTManager(app)

# MongoDB
client = MongoClient(app.config['MONGO_URI'])
db = client.placement_db

# Make db accessible globally
app.db = db

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Register blueprints
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.analysis import analysis_bp
from routes.resume import resume_bp
from routes.dashboard import dashboard_bp
from routes.roadmap import roadmap_bp
from routes.speech import speech_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
app.register_blueprint(speech_bp, url_prefix='/api/speech')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Placement API running'}, 200

if __name__ == '__main__':
    print("🚀 Starting Placement Preparation API...")
    print("📦 Connected to MongoDB:", app.config['MONGO_URI'])
    app.run(debug=True, port=5000)
