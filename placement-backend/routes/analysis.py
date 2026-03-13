from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ml.scorer import compute_placement_score
from datetime import datetime

analysis_bp = Blueprint('analysis', __name__)


def get_db():
    return current_app.db


@analysis_bp.route('/score', methods=['POST'])
@jwt_required()
def get_score():
    db = get_db()
    user_id = get_jwt_identity()

    profile = db.profiles.find_one({'user_id': user_id})
    if not profile:
        return jsonify({'error': 'Profile not found. Please complete your profile first.'}), 404

    result = compute_placement_score(profile)

    # Save analysis result
    analysis_doc = {
        'user_id': user_id,
        'score': result['score'],
        'skill_gaps': result['skill_gaps'],
        'recommended_roles': result['recommended_roles'],
        'resume_feedback': result['resume_feedback'],
        'interview_readiness': result['interview_readiness'],
        'skill_breakdown': result['skill_breakdown'],
        'analyzed_at': datetime.utcnow()
    }

    existing = db.analysis.find_one({'user_id': user_id})
    if existing:
        db.analysis.update_one({'user_id': user_id}, {'$set': analysis_doc})
    else:
        db.analysis.insert_one(analysis_doc)

    return jsonify(result), 200


@analysis_bp.route('/result', methods=['GET'])
@jwt_required()
def get_result():
    db = get_db()
    user_id = get_jwt_identity()

    analysis = db.analysis.find_one({'user_id': user_id})
    if not analysis:
        return jsonify({'error': 'No analysis found. Run /api/analysis/score first.'}), 404

    analysis['_id'] = str(analysis['_id'])
    if 'analyzed_at' in analysis:
        analysis['analyzed_at'] = analysis['analyzed_at'].isoformat()
    return jsonify(analysis), 200
