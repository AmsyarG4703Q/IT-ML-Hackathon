"""
Train a Gradient Boosting classifier on placementdata.csv
Saves:
  ml/model.pkl       – the trained model pipeline
  ml/model_info.json – accuracy report + feature importance
"""
import os, json, pickle
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# ── Paths ────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
CSV  = os.path.join(BASE, 'placementdata.csv')
PKL  = os.path.join(BASE, 'model.pkl')
INFO = os.path.join(BASE, 'model_info.json')

# ── Load data ────────────────────────────────────────────────
print("📦 Loading dataset…")
df = pd.read_csv(CSV)
print(f"   Rows: {len(df)}  |  Columns: {list(df.columns)}")

# ── Feature engineering ──────────────────────────────────────
# Binary encode Yes/No columns
binary_cols = ['ExtracurricularActivities', 'PlacementTraining']
for col in binary_cols:
    df[col] = df[col].map({'Yes': 1, 'No': 0}).fillna(0)

# Encode target
df['label'] = (df['PlacementStatus'] == 'Placed').astype(int)

FEATURES = [
    'CGPA',
    'Internships',
    'Projects',
    'Workshops/Certifications',
    'AptitudeTestScore',
    'SoftSkillsRating',
    'ExtracurricularActivities',
    'PlacementTraining',
    'SSC_Marks',
    'HSC_Marks',
]

X = df[FEATURES].fillna(0)
y = df['label']

print(f"   Placed: {y.sum()} | NotPlaced: {(y==0).sum()}")

# ── Train / test split ───────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y)

# ── Model pipeline ───────────────────────────────────────────
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42,
    ))
])

print("🚀 Training Gradient Boosting model…")
pipeline.fit(X_train, y_train)

# ── Evaluation ───────────────────────────────────────────────
y_pred  = pipeline.predict(X_test)
acc     = accuracy_score(y_test, y_pred)
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')

print(f"\n✅ Test Accuracy  : {acc*100:.2f}%")
print(f"   CV Mean±Std   : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['NotPlaced','Placed']))

# ── Feature importance ───────────────────────────────────────
importances = pipeline.named_steps['clf'].feature_importances_
feat_imp = dict(sorted(zip(FEATURES, importances), key=lambda x: -x[1]))
print("\n🔑 Feature Importances:")
for f, v in feat_imp.items():
    bar = '█' * int(v * 40)
    print(f"  {f:<30} {bar} {v:.4f}")

# ── Save ─────────────────────────────────────────────────────
with open(PKL, 'wb') as f:
    pickle.dump({'pipeline': pipeline, 'features': FEATURES}, f)

with open(INFO, 'w') as f:
    json.dump({
        'accuracy':      round(acc, 4),
        'cv_mean':       round(float(cv_scores.mean()), 4),
        'cv_std':        round(float(cv_scores.std()),  4),
        'features':      FEATURES,
        'feature_importance': {k: round(float(v), 4) for k, v in feat_imp.items()},
        'n_train':       len(X_train),
        'n_test':        len(X_test),
    }, f, indent=2)

print(f"\n💾 Model saved → {PKL}")
print(f"📄 Info  saved → {INFO}")
print("Done! ✅")
