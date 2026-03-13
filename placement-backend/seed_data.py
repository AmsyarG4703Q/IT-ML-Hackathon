"""
Seed script: Populates MongoDB with sample student data, profiles, and analysis results.
Run: python seed_data.py
"""
from pymongo import MongoClient
import bcrypt
from datetime import datetime, timedelta
import random

MONGO_URI = 'mongodb://localhost:27017/placement_db'
client = MongoClient(MONGO_URI)
db = client.placement_db

# Clear existing data
db.users.drop()
db.profiles.drop()
db.analysis.drop()
print('🗑️  Cleared existing collections.')

SAMPLE_STUDENTS = [
    {
        'user': {'name': 'Arjun Sharma', 'email': 'arjun@example.com'},
        'profile': {
            'name': 'Arjun Sharma', 'branch': 'Computer Science', 'graduation_year': '2025',
            'target_role': 'Software Engineer',
            'programming_languages': ['Python', 'Java', 'C++'],
            'technologies': ['React', 'Django', 'Git', 'SQL'],
            'coding_platforms': {'leetcode_solved': 180, 'hackerrank_stars': 4, 'codeforces_rating': 1450},
            'projects': [
                {'name': 'E-Commerce Platform', 'description': 'Full stack app with Django & React', 'tech': ['Django', 'React', 'PostgreSQL']},
                {'name': 'Chat Application', 'description': 'Real-time chat with WebSockets', 'tech': ['Node.js', 'Socket.io', 'MongoDB']},
            ],
            'communication_rating': 8,
            'resume_skills': ['Python', 'Java', 'React', 'SQL'],
            'resume_filename': 'arjun_resume.pdf',
        }
    },
    {
        'user': {'name': 'Priya Mehta', 'email': 'priya@example.com'},
        'profile': {
            'name': 'Priya Mehta', 'branch': 'Information Technology', 'graduation_year': '2025',
            'target_role': 'Data Scientist',
            'programming_languages': ['Python', 'R'],
            'technologies': ['TensorFlow', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL'],
            'coding_platforms': {'leetcode_solved': 80, 'hackerrank_stars': 3, 'codeforces_rating': 0},
            'projects': [
                {'name': 'Sentiment Analysis', 'description': 'NLP model for Twitter sentiment', 'tech': ['Python', 'NLTK', 'Scikit-learn']},
                {'name': 'House Price Prediction', 'description': 'ML regression model', 'tech': ['Python', 'Pandas', 'XGBoost']},
                {'name': 'Covid Dashboard', 'description': 'Data visualization project', 'tech': ['Python', 'Plotly', 'Dash']},
            ],
            'communication_rating': 7,
            'resume_skills': ['Python', 'Machine Learning', 'Pandas', 'TensorFlow'],
            'resume_filename': 'priya_resume.pdf',
        }
    },
    {
        'user': {'name': 'Rahul Verma', 'email': 'rahul@example.com'},
        'profile': {
            'name': 'Rahul Verma', 'branch': 'Electronics & Communication', 'graduation_year': '2025',
            'target_role': 'Frontend Developer',
            'programming_languages': ['JavaScript', 'TypeScript'],
            'technologies': ['React', 'Vue.js', 'CSS', 'HTML', 'Node.js', 'Git'],
            'coding_platforms': {'leetcode_solved': 45, 'hackerrank_stars': 2, 'codeforces_rating': 0},
            'projects': [
                {'name': 'Portfolio Website', 'description': 'Personal portfolio with React', 'tech': ['React', 'CSS', 'GitHub Pages']},
            ],
            'communication_rating': 6,
            'resume_skills': ['JavaScript', 'React', 'HTML', 'CSS'],
            'resume_filename': '',
        }
    },
    {
        'user': {'name': 'Sneha Patel', 'email': 'sneha@example.com'},
        'profile': {
            'name': 'Sneha Patel', 'branch': 'Computer Science', 'graduation_year': '2026',
            'target_role': 'Machine Learning Engineer',
            'programming_languages': ['Python', 'C++'],
            'technologies': ['PyTorch', 'TensorFlow', 'Docker', 'AWS', 'Git', 'SQL'],
            'coding_platforms': {'leetcode_solved': 220, 'hackerrank_stars': 5, 'codeforces_rating': 1700},
            'projects': [
                {'name': 'Object Detection System', 'description': 'YOLO-based detection', 'tech': ['Python', 'PyTorch', 'OpenCV']},
                {'name': 'Recommendation Engine', 'description': 'Collaborative filtering system', 'tech': ['Python', 'Scikit-learn', 'Flask']},
                {'name': 'NLP Chatbot', 'description': 'Transformer-based QA bot', 'tech': ['Python', 'HuggingFace', 'FastAPI']},
            ],
            'communication_rating': 9,
            'resume_skills': ['Python', 'Deep Learning', 'PyTorch', 'Docker', 'AWS'],
            'resume_filename': 'sneha_resume.pdf',
        }
    },
    {
        'user': {'name': 'Dev Kumar', 'email': 'dev@example.com'},
        'profile': {
            'name': 'Dev Kumar', 'branch': 'Mechanical Engineering', 'graduation_year': '2025',
            'target_role': 'Software Engineer',
            'programming_languages': ['Python'],
            'technologies': ['Git'],
            'coding_platforms': {'leetcode_solved': 15, 'hackerrank_stars': 1, 'codeforces_rating': 0},
            'projects': [],
            'communication_rating': 5,
            'resume_skills': ['Python'],
            'resume_filename': '',
        }
    },
]

# Import scorer
import sys
sys.path.insert(0, '.')
from ml.scorer import compute_placement_score

password = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt())

for student in SAMPLE_STUDENTS:
    u = student['user']
    p = student['profile']

    # Insert user
    user_doc = {
        'name': u['name'],
        'email': u['email'],
        'password': password,
        'created_at': datetime.utcnow() - timedelta(days=random.randint(1, 30)),
        'profile_complete': True
    }
    user_result = db.users.insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    # Insert profile
    p['user_id'] = user_id
    p['created_at'] = datetime.utcnow() - timedelta(days=random.randint(1, 20))
    p['updated_at'] = datetime.utcnow()
    db.profiles.insert_one(p)

    # Compute and insert analysis
    analysis = compute_placement_score(p)
    analysis['user_id'] = user_id
    analysis['analyzed_at'] = datetime.utcnow()
    db.analysis.insert_one(analysis)

    print(f'✅ Seeded: {u["name"]} | Score: {analysis["score"]}')

print('\n🎉 Sample data seeded successfully!')
print('   All passwords: password123')
print('   Emails: arjun@example.com, priya@example.com, rahul@example.com, sneha@example.com, dev@example.com')
