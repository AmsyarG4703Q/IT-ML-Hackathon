from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

roadmap_bp = Blueprint('roadmap', __name__)


def get_db():
    return current_app.db


ROADMAP_TEMPLATES = {
    'Software Engineer': [
        {'phase': 1, 'title': 'DSA Foundation', 'duration': '4 weeks', 'tasks': [
            'Complete arrays, strings, linked lists on LeetCode',
            'Solve 50 easy + 20 medium problems',
            'Practice on GeeksforGeeks daily',
        ]},
        {'phase': 2, 'title': 'Core CS Concepts', 'duration': '2 weeks', 'tasks': [
            'Revise OS concepts (process, threads, deadlock)',
            'Study DBMS and write SQL queries',
            'Revise Computer Networks basics',
        ]},
        {'phase': 3, 'title': 'System Design Basics', 'duration': '2 weeks', 'tasks': [
            'Read System Design Primer on GitHub',
            'Practice designing URL shortener, Twitter feed',
            'Understand CAP theorem, caching, CDN',
        ]},
        {'phase': 4, 'title': 'Projects & Portfolio', 'duration': '3 weeks', 'tasks': [
            'Build one full-stack CRUD application',
            'Deploy on GitHub and write README',
            'Add project to LinkedIn and resume',
        ]},
        {'phase': 5, 'title': 'Mock Interviews', 'duration': '2 weeks', 'tasks': [
            'Take 5 mock interviews on Pramp or InterviewBit',
            'Record yourself answering HR questions',
            'Practice STAR method for behavioral rounds',
        ]},
    ],
    'Data Scientist': [
        {'phase': 1, 'title': 'Python & Statistics', 'duration': '3 weeks', 'tasks': [
            'Master NumPy, Pandas, Matplotlib',
            'Revise statistics: mean, variance, distributions',
            'Complete Kaggle Python course',
        ]},
        {'phase': 2, 'title': 'Machine Learning Core', 'duration': '4 weeks', 'tasks': [
            'Study supervised learning algorithms (regression, SVM, trees)',
            'Build ML models with Scikit-Learn',
            'Complete Google ML Crash Course',
        ]},
        {'phase': 3, 'title': 'Deep Learning', 'duration': '3 weeks', 'tasks': [
            'Learn TensorFlow or PyTorch basics',
            'Build CNN for image classification',
            'Complete fast.ai Practical Deep Learning course',
        ]},
        {'phase': 4, 'title': 'Projects & Kaggle', 'duration': '3 weeks', 'tasks': [
            'Participate in 2 Kaggle competitions',
            'Build end-to-end ML pipeline project',
            'Deploy model as REST API',
        ]},
        {'phase': 5, 'title': 'Interview Prep', 'duration': '1 week', 'tasks': [
            'Study case study interviews',
            'Revise SQL for data analysis',
            'Practice explaining model decisions clearly',
        ]},
    ],
    'Frontend Developer': [
        {'phase': 1, 'title': 'HTML/CSS Mastery', 'duration': '2 weeks', 'tasks': [
            'Build 5 responsive layouts with Flexbox/Grid',
            'Learn CSS animations and transitions',
            'Study accessibility and semantic HTML',
        ]},
        {'phase': 2, 'title': 'JavaScript Deep Dive', 'duration': '3 weeks', 'tasks': [
            'Master ES6+ features (promises, async/await, destructuring)',
            'Solve 30 JS challenges on Edabit',
            'Build 3 vanilla JS projects',
        ]},
        {'phase': 3, 'title': 'React.js', 'duration': '4 weeks', 'tasks': [
            'Complete React official tutorial',
            'Build Todo, Weather App, and Blog with React',
            'Learn React Router and Context API',
        ]},
        {'phase': 4, 'title': 'Portfolio Projects', 'duration': '2 weeks', 'tasks': [
            'Build portfolio website with React',
            'Deploy projects on Netlify or Vercel',
            'Contribute to open source',
        ]},
        {'phase': 5, 'title': 'Interview Prep', 'duration': '1 week', 'tasks': [
            'Study DOM manipulation questions',
            'Practice CSS layout challenges',
            'Do mock technical interviews',
        ]},
    ],
}

COMMUNICATION_TIPS = [
    'Join a Toastmasters club or similar public speaking group',
    'Practice the STAR method for behavioral questions',
    'Record yourself answering interview questions and review',
    'Read one business book per month to improve vocabulary',
    'Do daily 5-minute presentation on any topic to a friend',
]

GENERIC_ROADMAP = ROADMAP_TEMPLATES['Software Engineer']


@roadmap_bp.route('/generate', methods=['GET'])
@jwt_required()
def generate_roadmap():
    db = get_db()
    user_id = get_jwt_identity()

    profile = db.profiles.find_one({'user_id': user_id})
    analysis = db.analysis.find_one({'user_id': user_id})

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    target_role = profile.get('target_role', 'Software Engineer')
    comm_rating = profile.get('communication_rating', 5)

    # Select roadmap template
    roadmap_phases = None
    for key in ROADMAP_TEMPLATES:
        if key.lower() in target_role.lower():
            roadmap_phases = ROADMAP_TEMPLATES[key]
            break
    if not roadmap_phases:
        roadmap_phases = GENERIC_ROADMAP

    # Communication improvement steps
    comm_steps = []
    if comm_rating < 7:
        comm_steps = COMMUNICATION_TIPS

    # Skill-gap targeted tasks
    skill_gap_tasks = []
    gaps = analysis.get('skill_gaps', []) if analysis else []
    for gap in gaps[:3]:
        skill_gap_tasks.append(f'Focus on {gap}: complete at least one course or project')

    return jsonify({
        'target_role': target_role,
        'phases': roadmap_phases,
        'communication_improvement': comm_steps,
        'skill_gap_tasks': skill_gap_tasks,
        'total_duration': f'{sum(int(p["duration"].split()[0]) for p in roadmap_phases)} weeks',
        'mock_interview_plan': [
            'Week 1: Technical DSA round simulation (30 min daily)',
            'Week 2: System design discussion practice',
            'Week 3: HR & behavioral round using STAR method',
            'Week 4: Full mock interview with a peer or on Pramp',
        ]
    }), 200
