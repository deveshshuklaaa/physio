# 🩸 Hemophilia Care Management System

A full-stack web application designed for hemophilia patient management, clinical monitoring, doctor interaction, exercise recommendation, AI-assisted chatbot support, and administrator monitoring.

The system provides separate functionality for:

* 👤 Patients
* 👨‍⚕️ Doctors / Clinicians
* 🛡️ Administrators
* 🤖 AI Chatbot
* 🧠 ML-based Exercise Recommendations

---

# 📌 Features

## 👤 Patient

* Patient registration and onboarding
* OTP-based authentication
* Consent management
* Multilingual support

  * English
  * Hindi
  * Marathi
* Patient profile management
* Hemophilia clinical information
* Bleeding and treatment information
* Joint information
* Target-joint tracking
* Physiotherapy information
* Exercise recommendations
* Exercise plan viewing
* Doctor-approved exercise plans
* AI-powered hemophilia chatbot
* Patient reports and care guidance

---

## 👨‍⚕️ Doctor / Clinician

* Secure doctor authentication
* Doctor dashboard
* Patient monitoring
* Patient research / detailed patient records
* Hemophilia clinical information
* Exercise recommendation review
* Approve ML-generated exercise recommendations
* Remove unsuitable recommendations
* Manually prescribe exercises
* Monitor patient exercise plans
* Review patient information and clinical data

---

## 🛡️ Administrator

* Administrator authentication
* Admin dashboard
* Doctor management
* Doctor request management
* Patient monitoring
* Patient research
* Admin management
* Admin profile
* Admin password management
* Exercise recommendation monitoring

### Admin Exercise Permissions

Administrators can:

* View exercise recommendations
* Monitor active exercises
* Monitor pending recommendations
* Monitor doctor-added exercises

Administrators **cannot**:

* Approve exercises
* Remove exercises
* Add exercises

Exercise approval and prescription remain doctor-controlled.

---

# 🧠 Exercise Recommendation System

The application contains a safety-first ML exercise recommendation pipeline.

### Flow

```text
Patient Hemophilia Details
          ↓
Safety Evaluation
          ↓
Clinical Phase Detection
          ↓
ML Prediction
          ↓
Exercise Category
          ↓
Exercise Catalogue
          ↓
Exercise Recommendations
          ↓
PENDING_DOCTOR_REVIEW
          ↓
Doctor Review
          ↓
ACTIVE / REMOVED
```

The ML system uses patient clinical/exercise-related features to predict an appropriate exercise category.

The current exercise catalogue contains categories including:

* Knee
* Ankle
* Hip
* Lumbar Spine
* Breathing
* Elbow
* Shoulder
* Balance

The ML prototype contains Logistic Regression, Random Forest and XGBoost evaluation. The final recommendation model is saved as:

```text
hemophysio_recommendation_model.pkl
```

with metadata:

```text
hemophysio_recommendation_model_metadata.json
```

The exercise recommendation system includes a safety engine that can withhold exercise recommendations when active bleeding or other clinical-review conditions are detected.

**Important:** The ML exercise system is a prototype / decision-support system and is not a substitute for professional medical judgment. Doctor review is required before recommendations become active.

---

# 🤖 AI Chatbot

The application includes a hemophilia-focused AI chatbot.

The chatbot:

* Supports English
* Supports Hindi
* Supports Marathi
* Classifies questions as in-scope or out-of-scope
* Handles hemophilia-related questions
* Supports assessment questions
* Uses AI-generated responses where appropriate
* Uses the application's assessment context
* Prevents duplicate rapid submissions

The chatbot backend communicates with the AI service through the configured environment variables.

---

# 🏗️ Project Structure

The project is organized approximately as follows:

```text
Hemophillia/
│
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── ml/
│   │   └── ...
│   │
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── ...
│   │
│   └── package.json
│
├── .gitignore
├── .env.example
└── README.md
```

---

# 💻 Prerequisites

Install the following before running the project:

### 1. Node.js

Install the current Node.js LTS release from the official Node.js website:

https://nodejs.org/

Verify installation:

```bash
node -v
npm -v
```

Node.js includes npm, which is used to install the project's JavaScript dependencies.

### 2. Python

Python is required for the ML exercise recommendation system.

Install Python from:

https://www.python.org/downloads/

Verify:

```bash
python --version
```

or on some Windows systems:

```bash
py --version
```

### 3. MongoDB

The backend requires a MongoDB database.

You can use:

* MongoDB Atlas
* Local MongoDB

The MongoDB connection string must be configured in the backend `.env` file.

---

# 📦 Installing Node Modules

## Backend

Open a terminal in the backend directory:

```bash
cd backend
```

Install all backend dependencies:

```bash
npm install
```

This installs the dependencies specified in:

```text
backend/package.json
```

---

## Frontend

Open another terminal:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

This installs the dependencies specified in:

```text
frontend/package.json
```

### ⚠️ Do NOT copy `node_modules` from another computer.

Simply run:

```bash
npm install
```

after cloning the project.

---

# 🐍 Python ML Dependencies

The exercise recommendation system uses Python for ML inference.

Create a Python virtual environment inside the backend:

```bash
cd backend

python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Then install the required ML libraries:

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

If a `requirements.txt` file is provided in the project, use:

```bash
pip install -r requirements.txt
```

instead.

---

# 🔐 Environment Variables

### IMPORTANT

The real `.env` file must **NOT be uploaded to GitHub**.

The project should contain:

```text
.env
.env.example
.gitignore
```

The `.env` file contains real credentials and secrets.

The `.env.example` file contains only placeholders.

---

# 📝 Backend `.env`

Create:

```text
backend/.env
```

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

```

Use the actual variable names required by your backend.

### Never commit real values such as:

```text
MongoDB passwords
JWT secrets
Google/GCP API keys
Gemini API keys
Private API credentials
```

---

# 📄 `.env.example`

The repository should contain an example file such as:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

The values must be placeholders.

---

# 🚫 Git Security

The `.gitignore` file should contain at least:

```gitignore
.env
.env.*
!.env.example

node_modules/

__pycache__/
*.py[cod]

*.log

dist/
build/

.vscode/
.idea/

.DS_Store
Thumbs.db
```

Never use:

```bash
git add -f .env
```

---

# 🧠 ML Model Files

The ML inference system expects the trained model and metadata files when ML inference is enabled.

Expected files include:

```text
hemophysio_recommendation_model.pkl
hemophysio_recommendation_model_metadata.json
```

If these files are not included in the repository, generate or obtain them using the ML training script before running ML inference.

Do not commit private credentials or secrets into model/configuration files.

---

# ▶️ Running the Backend

Open Terminal 1:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Make sure:

```text
backend/.env
```

exists.

Then start the backend using the project's configured npm script:

```bash
npm start
```

If the project uses a development script:

```bash
npm run dev
```

The backend will normally run on a port such as:

```text
http://localhost:5000
```

The exact port is controlled by the backend configuration / `.env`.

---

# ▶️ Running the Frontend

Open Terminal 2:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Then start the frontend:

```bash
npm start
```

If the project uses Vite:

```bash
npm run dev
```

The terminal will display the local frontend URL.

Common examples are:

```text
http://localhost:3000
```

or:

```text
http://localhost:5173
```

Use the URL shown by your frontend terminal.

---

# 🐍 Running the ML System

If the backend invokes the Python ML inference automatically, you normally do **not** need to start a separate ML server.

The Node.js backend launches the Python inference process when an exercise recommendation is generated.

Make sure:

```text
Python
```

is installed and available in the system PATH.

Verify:

```bash
python --version
```

and:

```bash
pip --version
```

Then install:

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

---

# 🔄 Complete First-Time Setup

After cloning the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Enter the project:

```bash
cd Hemophillia
```

### Backend

```bash
cd backend
npm install
```

### Python

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install ML dependencies:

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

### Configure environment

Create:

```text
backend/.env
```

and add your real environment variables.

### Frontend

Open another terminal:

```bash
cd frontend
npm install
```

---

# 🚀 Start the Application

## Terminal 1 — Backend

```bash
cd backend
npm start
```

or:

```bash
npm run dev
```

## Terminal 2 — Frontend

```bash
cd frontend
npm start
```

or:

```bash
npm run dev
```

Then open the frontend URL displayed in the terminal.

---

# 🔑 Authentication Flow

### Patient

```text
Login
 ↓
OTP Verification
 ↓
Consent
 ↓
Patient Profile
 ↓
Hemophilia Details
 ↓
Exercise Recommendation
 ↓
Care / Home
```

For returning patients, completed onboarding allows the user to proceed directly to the appropriate authenticated application flow.

### Doctor

```text
Doctor Login
 ↓
Doctor Dashboard
 ↓
Patient Research
 ↓
Patient Details
 ↓
Exercise Review
```

### Administrator

```text
Admin Login
 ↓
Admin Dashboard
 ↓
Doctor / Patient Monitoring
 ↓
Patient Research
 ↓
Exercise Monitoring
```

---

# 🩺 Exercise Recommendation Approval

ML-generated recommendations are initially stored as:

```text
PENDING_DOCTOR_REVIEW
```

The doctor can:

```text
Approve
```

or:

```text
Remove
```

a recommendation.

Approved recommendations become:

```text
ACTIVE
```

Administrators can monitor recommendations but cannot approve, remove, or manually prescribe exercises.

---

# 🛠️ Troubleshooting

## `npm` is not recognized

Install Node.js and restart the terminal.

Check:

```bash
node -v
npm -v
```

---

## `python` is not recognized

Install Python and ensure it is added to PATH.

Check:

```bash
python --version
```

---

## MongoDB connection error

Check:

```text
backend/.env
```

and verify:

```text
MONGO_URI
```

is correct.

---

## JWT authentication error

Make sure the same JWT secret is used consistently by the backend:

```env
JWT_SECRET=your_secret
```

After changing environment variables, restart the backend.

---

## ML recommendation error

Check:

```bash
python --version
```

Then:

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

Also verify that the ML inference script and model files exist in the locations expected by the backend.

---

## `Cannot find module`

Run:

```bash
npm install
```

inside the directory containing the relevant `package.json`.

For example:

```bash
cd backend
npm install
```

or:

```bash
cd frontend
npm install
```

---

# 🔒 Security Notes

This application handles sensitive patient and clinical information.

Never commit:

* `.env`
* Database credentials
* JWT secrets
* API keys
* GCP service-account credentials
* Private certificates
* Production credentials

Use:

```text
.env.example
```

for documenting required environment variables.

---

# ⚕️ Medical Safety Notice

The exercise recommendation functionality is intended as a software/ML decision-support component.

It does not replace:

* A physician
* A physiotherapist
* Clinical assessment
* Emergency medical care

Exercise recommendations generated by the ML system are subject to doctor review before becoming active patient recommendations.

---

# 📚 Technology Stack

## Frontend

* React
* React Router
* JavaScript / JSX
* CSS
* Axios / API client

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* REST APIs

## Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* XGBoost
* Joblib

## AI

* AI-powered hemophilia chatbot
* AI-assisted question classification and response generation

---

# 👥 User Roles

| Role          | Main Responsibility                                         |
| ------------- | ----------------------------------------------------------- |
| Patient       | Manage profile, clinical information and view exercise plan |
| Doctor        | Review patients and manage exercise recommendations         |
| Administrator | Monitor doctors, patients and exercise recommendations      |
| Super Admin   | Administrative management and system-level administration   |

---

# 📌 Important

After cloning the repository, the following should generally be installed locally:

```bash
npm install
```

for both frontend and backend, and:

```bash
pip install pandas numpy scikit-learn xgboost joblib
```

for the Python ML components.

The real `.env` must be created locally and must never be committed to GitHub.
