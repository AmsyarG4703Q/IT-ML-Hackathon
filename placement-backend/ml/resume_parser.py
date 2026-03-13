"""
Resume Parser: Extracts skills from uploaded PDF resumes using keyword matching.
"""
import re

KNOWN_SKILLS = [
    # Languages
    'Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin',
    'Swift', 'Ruby', 'PHP', 'Scala', 'R', 'MATLAB',
    # Web
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI',
    'HTML', 'CSS', 'Bootstrap', 'Tailwind',
    # Data/ML
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Keras',
    'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Science',
    # Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra',
    # Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions',
    # Tools
    'Git', 'GitHub', 'Linux', 'REST APIs', 'GraphQL', 'Microservices',
    # Other
    'System Design', 'Data Structures', 'Algorithms', 'OOP', 'Agile', 'Scrum',
]


def parse_resume(filepath):
    """
    Extracts text from PDF and returns a dictionary of matched skills and projects.
    """
    text = extract_text(filepath)
    skills = extract_skills(text)
    projects = extract_projects(text)
    return {'skills': skills, 'projects': projects}


def extract_text(filepath):
    """Extract raw text from PDF file."""
    try:
        import PyPDF2
        text = ''
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ''
        return text
    except Exception as e:
        print(f'[Resume Parser] Error reading PDF: {e}')
        return ''


def extract_skills(text):
    """Match known skills against resume text (case-insensitive)."""
    if not text:
        return []

    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        # Word boundary match
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)

    return found


def extract_projects(text):
    """Attempt to extract projects by looking for a 'Projects' section."""
    if not text:
        return []
        
    projects = []
    text_lower = text.lower()
    
    # Try to find the section matching "Projects" or "Personal Projects"
    # and extract text until the next section header (e.g., Experience, Education, Skills)
    match = re.search(r'\b(projects|personal projects|academic projects)\b[\s\S]*?(?=\b(experience|education|skills|certifications|languages|achievements)\b|$)', text_lower, re.IGNORECASE)
    
    if match:
        projects_section = match.group(0)
        # VERY basic heuristic: split by newlines and look for non-empty lines that might be project titles
        lines = [line.strip() for line in projects_section.split('\n') if line.strip()]
        
        # Skip the "projects" header itself
        lines = lines[1:] 
        
        # Group lines into project dictionaries. Just grabbing chunks.
        current_project_name = ""
        current_desc = []
        
        for line in lines:
            # If line is short or has no verbs, assume it's a title
            if len(line) < 50 and not re.search(r'\b(developed|built|created|using|designed|implemented)\b', line, re.IGNORECASE):
                if current_project_name:
                    projects.append({
                        'name': current_project_name.title(),
                        'description': ' '.join(current_desc).capitalize(),
                        'link': ''
                    })
                current_project_name = line
                current_desc = []
            else:
                if not current_project_name:
                    current_project_name = "Extracted Project"
                current_desc.append(line)
                
        # Add the last project
        if current_project_name:
             projects.append({
                 'name': current_project_name.title(),
                 'description': ' '.join(current_desc).capitalize(),
                 'link': ''
             })
             
    # Clean up empty or garbage projects
    valid_projects = [p for p in projects if len(p['name']) > 2 and len(p['description']) > 10]
    return valid_projects[:3] # Limit to top 3

