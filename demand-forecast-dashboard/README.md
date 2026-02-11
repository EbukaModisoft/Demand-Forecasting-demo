# Demand Forecast Dashboard

This is the main application for the Demand Forecasting Demo. It is built using Next.js and React.

## Key Modules

- `src/app/page.tsx`: The main dashboard orchestrator managing state for business types, views, and date ranges.
- `src/lib/actionEngine.ts`: The logic engine that generates prioritized recommendations (Labor, Promo, Fuel, etc.).
- `src/lib/mockData.ts`: Realistic demand data generator for various retail verticals.
- `src/components/`: Modular UI components including charts, drawers, and the AI Action Center.

## Implementation Highlights

- **Dynamic Range Awareness**: All KPIs, including fuel metrics, react instantly to the global date range selector.
- **Scenario State**: Uses localized state multipliers to allow "What-if" analysis without affecting the original data.
- **Responsive Layout**: Designed for tablets and desktops, featuring a "Simple Briefing" mode for quick status checks.

## Development

Run the development server:
```bash
npm run dev
```
