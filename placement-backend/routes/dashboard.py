from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint('dashboard', __name__)


def get_db():
    return current_app.db


@dashboard_bp.route('/data', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    db = get_db()
    user_id = get_jwt_identity()

    profile = db.profiles.find_one({'user_id': user_id})
    analysis = db.analysis.find_one({'user_id': user_id})

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    # Learning resources mapped to skill gaps
    resources = generate_resources(analysis.get('skill_gaps', []) if analysis else [])

    # Weekly progress (mock data based on profile)
    weekly_progress = [
        {'week': 'Week 1', 'score': 20},
        {'week': 'Week 2', 'score': 35},
        {'week': 'Week 3', 'score': 50},
        {'week': 'Week 4', 'score': analysis.get('score', 60) if analysis else 60},
    ]

    dashboard_data = {
        'profile': {
            'name': profile.get('name', ''),
            'branch': profile.get('branch', ''),
            'graduation_year': profile.get('graduation_year', ''),
            'target_role': profile.get('target_role', ''),
        },
        'score': analysis.get('score', 0) if analysis else 0,
        'skill_breakdown': analysis.get('skill_breakdown', {}) if analysis else {},
        'skill_gaps': analysis.get('skill_gaps', []) if analysis else [],
        'recommended_roles': analysis.get('recommended_roles', []) if analysis else [],
        'resume_feedback': analysis.get('resume_feedback', '') if analysis else '',
        'interview_readiness': analysis.get('interview_readiness', {}) if analysis else {},
        'learning_resources': resources,
        'weekly_progress': weekly_progress,
        'stats': {
            'languages_known': len(profile.get('programming_languages', [])),
            'technologies_known': len(profile.get('technologies', [])),
            'projects_count': len(profile.get('projects', [])),
            'communication_score': profile.get('communication_rating', 5),
        }
    }

    return jsonify(dashboard_data), 200


def generate_resources(skill_gaps):
    resource_map = {
        'Data Structures': [
            {'title': 'DSA Course - GeeksforGeeks', 'url': 'https://www.geeksforgeeks.org/data-structures/', 'type': 'Course'},
            {'title': 'LeetCode DSA Problems', 'url': 'https://leetcode.com/explore/learn/', 'type': 'Practice'},
        ],
        'System Design': [
            {'title': 'System Design Primer', 'url': 'https://github.com/donnemartin/system-design-primer', 'type': 'Guide'},
            {'title': 'Grokking System Design', 'url': 'https://www.educative.io/courses/grokking-the-system-design-interview', 'type': 'Course'},
        ],
        'Machine Learning': [
            {'title': 'ML Crash Course - Google', 'url': 'https://developers.google.com/machine-learning/crash-course', 'type': 'Course'},
            {'title': 'Kaggle ML Tutorials', 'url': 'https://www.kaggle.com/learn', 'type': 'Practice'},
        ],
        'Web Development': [
            {'title': 'The Odin Project', 'url': 'https://www.theodinproject.com/', 'type': 'Course'},
            {'title': 'MDN Web Docs', 'url': 'https://developer.mozilla.org/', 'type': 'Reference'},
        ],
        'Communication': [
            {'title': 'Toastmasters International', 'url': 'https://www.toastmasters.org/', 'type': 'Community'},
            {'title': 'Public Speaking Course - Coursera', 'url': 'https://www.coursera.org/learn/public-speaking', 'type': 'Course'},
        ],
        'SQL': [
            {'title': 'SQLZoo', 'url': 'https://sqlzoo.net/', 'type': 'Practice'},
            {'title': 'W3Schools SQL Tutorial', 'url': 'https://www.w3schools.com/sql/', 'type': 'Tutorial'},
        ],
        'Cloud Computing': [
            {'title': 'AWS Free Tier', 'url': 'https://aws.amazon.com/free/', 'type': 'Platform'},
            {'title': 'Google Cloud Skills Boost', 'url': 'https://cloudskillsboost.google/', 'type': 'Course'},
        ],
        'React': [
            {'title': 'React Official Docs', 'url': 'https://react.dev/', 'type': 'Documentation'},
            {'title': 'Full Stack Open', 'url': 'https://fullstackopen.com/', 'type': 'Course'},
        ],
    }

    resources = []
    for gap in skill_gaps[:5]:  # Top 5 gaps
        if gap in resource_map:
            resources.extend(resource_map[gap])

    # Always include general resources
    resources.append({'title': 'InterviewBit Practice', 'url': 'https://www.interviewbit.com/', 'type': 'Practice'})
    resources.append({'title': 'HackerRank Challenges', 'url': 'https://www.hackerrank.com/', 'type': 'Practice'})

    return resources[:10]
