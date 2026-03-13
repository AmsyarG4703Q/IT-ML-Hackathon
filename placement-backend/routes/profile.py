from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId

profile_bp = Blueprint('profile', __name__)


def get_db():
    return current_app.db


@profile_bp.route('/create', methods=['POST'])
@jwt_required()
def create_profile():
    db = get_db()
    user_id = get_jwt_identity()
    data = request.get_json()

    # Check if profile already exists
    existing = db.profiles.find_one({'user_id': user_id})

    profile = {
        'user_id': user_id,
        'name': data.get('name', ''),
        'branch': data.get('branch', ''),
        'graduation_year': data.get('graduation_year', ''),
        'target_role': data.get('target_role', ''),
        'programming_languages': data.get('programming_languages', []),
        'technologies': data.get('technologies', []),
        'coding_platforms': data.get('coding_platforms', {}),
        'projects': data.get('projects', []),
        'communication_rating': data.get('communication_rating', 5),
        'resume_skills': data.get('resume_skills', []),
        'resume_filename': data.get('resume_filename', ''),
        'updated_at': datetime.utcnow()
    }

    if existing:
        db.profiles.update_one({'user_id': user_id}, {'$set': profile})
        msg = 'Profile updated successfully'
    else:
        profile['created_at'] = datetime.utcnow()
        db.profiles.insert_one(profile)
        msg = 'Profile created successfully'

    # Mark user profile_complete
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'profile_complete': True}})

    return jsonify({'message': msg}), 200


@profile_bp.route('/get', methods=['GET'])
@jwt_required()
def get_profile():
    db = get_db()
    user_id = get_jwt_identity()
    profile = db.profiles.find_one({'user_id': user_id})

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    profile['_id'] = str(profile['_id'])
    return jsonify(profile), 200
