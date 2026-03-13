from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
import bcrypt
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


def get_db():
    return current_app.db


@auth_bp.route('/register', methods=['POST'])
def register():
    db = get_db()
    data = request.get_json()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user = {
        'name': name,
        'email': email,
        'password': hashed,
        'created_at': datetime.utcnow(),
        'profile_complete': False
    }
    result = db.users.insert_one(user)
    user_id = str(result.inserted_id)

    token = create_access_token(identity=user_id)
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': user_id,
            'name': name,
            'email': email,
            'profile_complete': False
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    db = get_db()
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    user_id = str(user['_id'])
    token = create_access_token(identity=user_id)

    profile = db.profiles.find_one({'user_id': user_id})
    profile_complete = profile is not None

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user_id,
            'name': user['name'],
            'email': user['email'],
            'profile_complete': profile_complete
        }
    }), 200
