# Demand Forecasting Dashboard Demo

A highly sophisticated, AI-driven demand forecasting platform tailored for SMB and Mid-Market retail operations (Convenience Stores, Gas Stations, Grocery, Liquor Stores, and Restaurants).

This demo showcases a "10/10" owner experience, focused on actionable insights rather than just raw data. 

## 🚀 Core Features

### 🏢 Multi-Vertical Support
Tailored experiences for different business types, each with unique KPIs, logic, and mock data:
- **Convenience Stores & Gas Stations**: Focused on foot traffic, rush hours, and fuel conversion.
- **Grocery Stores**: Focused on high-volume inventory turnover and category risks.
- **Liquor Stores**: Focused on spirits/beer trends and weekend run-up planning.
- **Restaurants**: Focused on cover counts, labor overhead, and prepared food demand.

### ⛽ Fuel Station Management (Exclusive)
Complete dashboard for gas station operations:
- **Real-time Tank Monitoring**: Backoffice-style vertical gauges for five tanks (Regular Unleaded 1/2, Diesel 1/2, Mid-grade) with reorder alerts.
- **Rush Hour Forecasting**: Hourly demand charts highlighting peak traffic for better staffing.
- **In-Store Conversion Tracking**: Predictive analytics showing how many fuel customers are likely to buy inside.
- **Fuel Alerts**: Side-by-side alert card next to Fuel Inventory for quick delivery and staffing actions.

### 🛠️ Intelligent Action Center
A recommendation engine that converts forecasts into tasks:
- **Labor**: Automated upstaffing/downstaffing alerts with suggested employees and tap-to-call.
- **Promotions**: Promo suggestions based on upcoming demand gaps.
- **Pricing**: Dynamic pricing recommendations based on inventory velocity.
- **Events/Weather**: Impact alerts for local events (games, concerts) and weather shifts.

### ✨ New Item Simulator
A dedicated tool for testing new product launches before committing:
- **Input Item Details**: Name, price, category, and launch location.
- **Real-time Projections**: See expected daily/weekly/monthly revenue and units.
- **Cannibalization Analysis**: Understand how the new item may compete with existing products.
- **30-Day Demand Curve**: Visual projection showing launch excitement decay over time.
- **Launch Promo Modeling**: Test different discount levels to optimize trial.
- **AI Insights**: Contextual recommendations based on pricing, location, and category benchmarks.

### 📊 Explainable AI & Confidence
- **Forecast Confidence**: A plain-language 0-100 score explaining *why* a forecast is reliable (e.g., data health, event overrides).
- **Chart Annotations**: Direct visual callouts on trends (e.g., "Heat wave: +12% cold drinks").

## 🛠️ Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3.6.0
- **Icons**: Lucide React

## 📦 Getting Started

1. Navigate to the dashboard directory:
   ```bash
   cd demand-forecast-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
