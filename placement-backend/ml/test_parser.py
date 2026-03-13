import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.resume_parser import extract_projects

test_resume = """
John Doe
Software Engineer

Experience
Worked at Google

Personal Projects
AI Placement Dashboard
Built a dashboard using React, Flask, and scikit-learn.
Implemented a custom ML model to predict placement chances.

Portfolio Website
Designed and deployed a personal portfolio using Next.js.

Skills
Python, React, JavaScript
"""

projects = extract_projects(test_resume)
print("Extracted Projects:", projects)
