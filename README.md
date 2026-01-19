**Analytics Dashboard UI (Angular)**

A modern, responsive Analytics Dashboard built using Angular, TypeScript, HTML, CSS, and Apache ECharts.
The dashboard visualizes learner enrollment, engagement, performance, and district-level rankings with yearly, monthly, and quarterly analytics.

**Features**
Yearly Data View (2024, 2025), Monthly & Quarterly Filters, District-wise Analytics,
Learner Demographics:(Male,Female,Others).

Course Progress Tracking:
Below Average
Average
Good

Assessment Analytics:
Assessment Taken
Passed
Failed

District Ranking System, Light & Dark UI Theme, Interactive charts using Apache ECharts, Data loaded dynamically via JSON-based API simulation.

**Tech Stack**
Technology	       Description
Angular        	Frontend framework
TypeScript	    Application logic
HTML5	          Structure
CSS3	          Styling & layout
Apache ECharts	Data visualization
JSON	          Mock API data source

**Project Structure**
src/
│
├── app/
├── components/
│   ├── dashboard/
├── shared/
│   │
│   ├── services/
│   │   └── api.service.ts
│   │
│   ├── models/
│   │   └── model.ts
│   │
│   └── pipes/
│       └── custom.pipe.ts
├── assets/
│   └── jsonResponses/
│       ├── dashboard_2024.json
│       └── dashboard_2025.json
│
└── styles/

**Data Source (Mock API)**

The dashboard consumes year-based JSON files as mock APIs.

JSON Files Used:
dashboard_2024.json
dashboard_2025.json

Sample Data Structure:
{
  "summary": {
    "totalLearners": 22500,
    "male": 12000,
    "female": 10000,
    "others": 500,
    "activeLearners": 9312,
    "engagedLearners": 785
  },
  "courseProgress": [
    {
      "district": "Ariyulur",
      "below": 20,
      "average": 35,
      "good": 45
    },
    ...
  ],
  "passStats": {
    "overallLearners": 22500,
    "assessmentTaken": 18563,
    "passed": 13500,
    "failed": 5063
  },
  "assessmentCompletion": {
    "completedPercent": 68,
    "notCompletedPercent": 32
  },
  "gradeBreakdown": [
    {
      "grade": "A",
      "label": "A - Grade (>80)",
      "percent": 48
    },
    ...
  ],
  "districtRanking": {
    "rankBy": "enrollment",
    "districts": [
      {
        "district": "Ariyulur",
        "rank": 1,
        "enrolled": 22500,
        "male": 12000,
        "female": 10000,
        "others": 500,
        "passed": 15000,
        "assessmentCompleted": 18563,
        "completionRatePercent": 68
      },
      ...
      ]
  }
}

**Data Flow Logic**

1.User selects:
  Year (2024 / 2025)
  Monthly or Quarterly
2.Angular service loads corresponding JSON file
3.Data is processed using TypeScript
4.Charts are updated dynamically using ECharts

**Monthly & Quarterly Calculation**

1.Monthly View:
  Values are calculated per month(Currently it's showing January Data only)

2.Quarterly View:
  Q1 → Jan–Mar
  Quarterly values are aggregated from monthly data
  
**Charts Implemented**

📊 Bar Chart – Course Progress Rate
📉 Horizontal Bar – Pass Percentage
🍩 Donut Chart – Assessment Completion
🥧 Pie Chart – Learners Grade Breakdown
📊 Multi-series Bar – District Ranking

All charts are built using Apache ECharts with dynamic configuration.

**Installation & Setup**
Prerequisites:
Node.js (v16+ recommended)
Angular CLI

Steps:
# Clone repository
git clone https://github.com/Surya104524/Analytics-Dashboard-UI.git

# Navigate to project
cd analytics

# Install dependencies
npm install

# Run application
ng serve

# Open browser
http://localhost:4200

**Key Learnings**

Implemented scalable dashboard architecture in Angular
Dynamic chart rendering using ECharts
Data-driven UI with JSON-based APIs
Monthly & quarterly aggregation logic
Responsive layout with light/dark themes

**Future Enhancements**

Replace JSON with real backend APIs
Authentication & role-based access
Export reports (PDF / Excel)
Mobile optimization
Performance optimization for large datasets  

**Author**

Surya R
Frontend Developer (Angular)
📍 Chennai, India

GitHub: https://github.com/Surya104524

LinkedIn: www.linkedin.com/in/surya-r-7850a8266
