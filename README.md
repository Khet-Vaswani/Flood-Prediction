# AI-Powered Flood Prediction & Emergency Response System 🌊🤖

An advanced, full-stack disaster management and coordination platform tailored for vulnerable regions. By combining machine learning predictive analytics, live weather feeds, interactive GIS mapping, and generative AI assistance, the system empowers both disaster response administrators and citizens with real-time actionable insights.

---

## 🌟 Key Features

### 1. 🤖 Live-Context Emergency Chatbot (Option 1)
* Powered by **Google Gemini API** (`gemini-1.5-flash`).
* Queries active database records to extract **live regional alerts**, **real-time weather parameters**, and **relief shelter capacity status** to inject as immediate context, ensuring factual, localized, and context-aware citizen guidance.

### 2. 🗺️ Interactive GIS Evacuation Routing (Option 2)
* Built on **Leaflet** with custom CartoDB Dark Matter map layers.
* Dynamically draws **Safe Evacuation Corridors** (dashed route lines) connecting high-severity crowdsourced distress reports to the nearest open relief shelter using distance-optimized spatial algorithms.

### 3. 📊 Disaster Analytics Hub (Option 3)
* Interactive data visualizations powered by **Recharts**.
* Provides live, tabbed graphs on the citizen dashboard detailing:
  * **Rainfall Distribution**: Comparative metrics (mm) across monitored monsoon districts.
  * **Relief Camp Occupancy**: Live metrics comparing evacuee load against maximum camp capacities.

### 4. 🧠 On-The-Fly ML Model Retraining Suite (Option 4)
* Powered by a **Random Forest Classifier** (`scikit-learn`).
* Allows administrators to upload custom CSV historical records, execute model retraining instantly, calculate updated accuracy scores, and visualize updated feature importances.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (TypeScript), TailwindCSS, Leaflet, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python), SQLAlchemy, SQLite / MySQL, Pydantic, HTTPX |
| **AI/ML** | Google Gemini Generative AI SDK, Scikit-Learn, Pandas, NumPy, Joblib |

---

## 🚀 Local Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js 18+

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install google-generativeai
   ```
4. Set environment variables (or create a `.env` file):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
5. Run the FastAPI development server:
   ```bash
   python run.py
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the application.
