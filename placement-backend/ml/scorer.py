"""
ML Scoring Engine
- Primary: Gradient Boosting model trained on placementdata.csv (ml/model.pkl)
- Fallback: Heuristic scoring if model.pkl doesn't exist yet
"""
import os, pickle

BASE      = os.path.dirname(__file__)
MODEL_PKL = os.path.join(BASE, 'model.pkl')

# ── Load model once at import time ───────────────────────────
_model_cache = None

def _load_model():
    global _model_cache
    if _model_cache is None and os.path.exists(MODEL_PKL):
        with open(MODEL_PKL, 'rb') as f:
            _model_cache = pickle.load(f)
    return _model_cache

# ── Role / skill maps (used for skill-gap & recommendations) ─
ROLE_SKILL_MAP = {
    'Software Engineer':         ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'Git', 'System Design'],
    'Data Scientist':            ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL', 'Statistics', 'Deep Learning', 'Data Visualization'],
    'Frontend Developer':        ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript', 'Git', 'REST APIs', 'UI/UX'],
    'Backend Developer':         ['Python', 'Node.js', 'SQL', 'MongoDB', 'REST APIs', 'Docker', 'Git', 'System Design'],
    'Full Stack Developer':      ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'MongoDB', 'Git', 'REST APIs'],
    'DevOps Engineer':           ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Python', 'Git', 'Terraform'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'SQL', 'Docker', 'MLOps'],
}

ALL_RECOMMENDED_ROLES = {
    'Python':          ['Software Engineer', 'Data Scientist', 'Backend Developer', 'Machine Learning Engineer'],
    'JavaScript':      ['Frontend Developer', 'Full Stack Developer', 'Backend Developer'],
    'Java':            ['Software Engineer', 'Backend Developer', 'Android Developer'],
    'Machine Learning':['Data Scientist', 'Machine Learning Engineer', 'AI Researcher'],
    'React':           ['Frontend Developer', 'Full Stack Developer'],
    'SQL':             ['Data Scientist', 'Backend Developer', 'Database Administrator'],
    'Docker':          ['DevOps Engineer', 'Backend Developer', 'Machine Learning Engineer'],
}


def compute_placement_score(profile):
    """
    Returns a dict with:
      score, skill_breakdown, skill_gaps, recommended_roles,
      resume_feedback, interview_readiness
    """
    langs         = [l.strip() for l in profile.get('programming_languages', [])]
    techs         = [t.strip() for t in profile.get('technologies', [])]
    projects      = profile.get('projects', [])
    comm_rating   = float(profile.get('communication_rating', 5))
    target_role   = profile.get('target_role', 'Software Engineer')
    coding_pf     = profile.get('coding_platforms', {})
    resume_skills = profile.get('resume_skills', [])

    project_count = len(projects) if isinstance(projects, list) else 0
    lc_solved     = int(coding_pf.get('leetcode_solved', 0))
    hr_score      = float(coding_pf.get('hackerrank_stars', 0))
    cp_rating     = float(coding_pf.get('codeforces_rating', 0))
    all_skills    = set(s.lower().strip() for s in langs + techs + resume_skills)

    # ── Try ML model first ───────────────────────────────────
    ml  = _load_model()
    total_score = None

    if ml:
        try:
            pipeline  = ml['pipeline']
            features  = ml['features']

            # Map profile fields to CSV feature names
            # CGPA proxy: use a reasonable default or pull from profile
            cgpa        = float(profile.get('cgpa', 7.5))
            internships = int(coding_pf.get('internships', min(project_count, 2)))
            workshops   = int(profile.get('workshops', 1))
            aptitude    = int(profile.get('aptitude_score', min(50 + lc_solved // 4, 90)))
            soft_skills = round(comm_rating / 2, 1)   # 0-10 → 0-5 scale
            extra       = 1 if profile.get('extracurricular', False) or hr_score > 0 else 0
            placement_training = 1 if profile.get('placement_training', False) else 0
            ssc         = float(profile.get('ssc_marks', 70))
            hsc         = float(profile.get('hsc_marks', 72))

            row = {
                'CGPA':                      cgpa,
                'Internships':               internships,
                'Projects':                  project_count,
                'Workshops/Certifications':  workshops,
                'AptitudeTestScore':         aptitude,
                'SoftSkillsRating':          soft_skills,
                'ExtracurricularActivities': extra,
                'PlacementTraining':         placement_training,
                'SSC_Marks':                 ssc,
                'HSC_Marks':                 hsc,
            }

            import pandas as pd
            X = pd.DataFrame([row])[features]

            prob        = pipeline.predict_proba(X)[0][1]   # P(Placed)
            total_score = int(round(prob * 100))
            total_score = max(5, min(99, total_score))
        except Exception as e:
            print(f"[scorer] ML model error: {e} — falling back to heuristics")
            total_score = None

    # ── Heuristic fallback ───────────────────────────────────
    if total_score is None:
        role_skills = ROLE_SKILL_MAP.get(target_role, ROLE_SKILL_MAP['Software Engineer'])
        matched     = sum(1 for s in role_skills if s.lower() in all_skills)
        tech_score  = (matched / len(role_skills)) * 30

        coding_score  = min(lc_solved / 200, 1.0) * 15
        coding_score += min(hr_score   / 5,   1.0) * 5
        coding_score += min(cp_rating  / 1600, 1.0) * 5

        project_score = min(project_count / 3, 1.0) * 20
        comm_score    = (comm_rating / 10.0) * 15

        completeness  = 0
        if profile.get('name'):             completeness += 2
        if profile.get('branch'):           completeness += 1
        if profile.get('graduation_year'):  completeness += 1
        if langs:                           completeness += 2
        if projects:                        completeness += 2
        if profile.get('resume_filename'):  completeness += 2

        total_score = round(tech_score + coding_score + project_score + comm_score + completeness)
        total_score = max(5, min(99, total_score))

    # ── Skill gaps ───────────────────────────────────────────
    role_skills = ROLE_SKILL_MAP.get(target_role, ROLE_SKILL_MAP['Software Engineer'])
    skill_gaps  = [s for s in role_skills if s.lower() not in all_skills and
                   not any(s.lower() in sk for sk in all_skills)]
    if comm_rating < 6:   skill_gaps.append('Communication')
    if lc_solved   < 50:  skill_gaps.append('Data Structures & Algorithms')
    if not projects:      skill_gaps.append('Project Experience')
    skill_gaps = list(dict.fromkeys(skill_gaps))[:6]

    # ── Recommended roles ────────────────────────────────────
    role_scores = {}
    for skill in langs + techs:
        for role in ALL_RECOMMENDED_ROLES.get(skill, []):
            role_scores[role] = role_scores.get(role, 0) + 1
    role_scores[target_role] = role_scores.get(target_role, 0) + 3
    recommended_roles = [r for r, _ in sorted(role_scores.items(), key=lambda x: -x[1])][:4]

    # ── Skill breakdown (for radar chart) ───────────────────
    # These are always derived heuristically for display
    _role_skills  = ROLE_SKILL_MAP.get(target_role, ROLE_SKILL_MAP['Software Engineer'])
    _matched      = sum(1 for s in _role_skills if s.lower() in all_skills)
    _tech_pct     = round(_matched / len(_role_skills) * 100)
    _coding_pct   = min(100, round((min(lc_solved/200,1)*15 + min(hr_score/5,1)*5 + min(cp_rating/1600,1)*5) / 25 * 100))
    _project_pct  = min(100, project_count * 33)
    _comm_pct     = int(comm_rating * 10)

    skill_breakdown = {
        'Technical Skills':    _tech_pct,
        'Coding Practice':     _coding_pct,
        'Projects':            _project_pct,
        'Communication':       _comm_pct,
        'Profile Completeness':min(100, round(total_score * 1.05)),
    }

    interview_readiness = {
        'technical':    _tech_pct,
        'dsa':          _coding_pct,
        'projects':     _project_pct,
        'communication':_comm_pct,
        'overall':      min(100, int(total_score * 1.1)),
    }

    return {
        'score':               total_score,
        'skill_breakdown':     skill_breakdown,
        'skill_gaps':          skill_gaps,
        'recommended_roles':   recommended_roles,
        'resume_feedback':     _resume_feedback(profile, all_skills, project_count, lc_solved),
        'interview_readiness': interview_readiness,
        'model_used':          'GradientBoosting-ML' if ml else 'Heuristic',
    }


def _resume_feedback(profile, skills, projects, lc_solved):
    fb = []
    if not profile.get('resume_filename'):
        fb.append('⚠️ No resume uploaded. Please upload your resume PDF.')
    if projects < 2:
        fb.append('📌 Add at least 2–3 projects to your resume to stand out.')
    if lc_solved < 50:
        fb.append('💡 Mention your coding platform profiles (LeetCode, HackerRank) on your resume.')
    if len(skills) < 5:
        fb.append('🔧 Expand your skills section — list more programming languages and tools.')
    if not fb:
        fb.append('✅ Your resume looks solid! Keep it updated with latest projects.')
        fb.append('✨ Quantify achievements (e.g., "Reduced load time by 40%") for more impact.')
    return ' '.join(fb)
