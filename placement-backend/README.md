# PlacementAI Setup Guide

## Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+
- MongoDB (running locally on port 27017)

---

## Step 1: Start MongoDB
```
mongod --dbpath C:\data\db
```
Or use MongoDB Compass / MongoDB Atlas.

---

## Step 2: Set Up Backend
```bash
cd placement-backend
pip install -r requirements.txt
python seed_data.py      # Seeds 5 sample students
python app.py            # Starts Flask on http://localhost:5000
```

---

## Step 3: Start Frontend
```bash
cd placement           # your React project folder
npm start              # Starts on http://localhost:3000
```

---

## Demo Accounts (after seeding)
| Name | Email | Password | Score |
|------|-------|----------|-------|
| Arjun Sharma | arjun@example.com | password123 | ~72 |
| Priya Mehta | priya@example.com | password123 | ~75 |
| Rahul Verma | rahul@example.com | password123 | ~40 |
| Sneha Patel | sneha@example.com | password123 | ~90 |
| Dev Kumar | dev@example.com | password123 | ~15 |

---

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/profile/create | Save profile |
| GET | /api/profile/get | Get profile |
| POST | /api/analysis/score | Run AI scoring |
| GET | /api/analysis/result | Get analysis |
| POST | /api/resume/upload | Upload PDF |
| GET | /api/dashboard/data | Dashboard data |
| GET | /api/roadmap/generate | Get roadmap |

---

## Replacing the ML Model
Edit `placement-backend/ml/scorer.py`.  
The function `compute_placement_score(profile)` accepts a profile dict and must return:
```python
{
  'score': int,              # 0-100
  'skill_breakdown': dict,   # {dimension: score}
  'skill_gaps': list,        # ['skill1', 'skill2', ...]
  'recommended_roles': list, # ['Role1', 'Role2', ...]
  'resume_feedback': str,
  'interview_readiness': dict,
}
```
