from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from ml.resume_parser import parse_resume
import os

resume_bp = Blueprint('resume', __name__)

ALLOWED_EXTENSIONS = {'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db():
    return current_app.db


@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    filename = secure_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Extract data from resume
    parsed_data = parse_resume(filepath)
    
    # Handle older version returning list vs new dict
    if isinstance(parsed_data, list):
        skills = parsed_data
        projects = []
    else:
        skills = parsed_data.get('skills', [])
        projects = parsed_data.get('projects', [])

    return jsonify({
        'message': 'Resume uploaded successfully',
        'filename': filename,
        'extracted_skills': skills,
        'extracted_projects': projects
    }), 200
