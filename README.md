# BLIiPSim v2 - Advanced Balloon Trajectory Prediction System

## Overview

BLIiPSim v2 is a sophisticated balloon trajectory prediction system that combines real-time weather data with advanced physics models to provide accurate landing predictions for high-altitude balloon flights.

## Features

- **Real-time Weather Integration**: Open-Meteo and NOAA GFS weather data
- **Advanced Physics Models**: CUSF and HabHub prediction algorithms
- **Interactive 3D Maps**: Real-time trajectory visualization
- **Multi-scenario Analysis**: Best case, worst case, and most likely predictions
- **Export Capabilities**: KML, GPX, and CSV export formats
- **Offline Support**: Service worker for offline functionality
- **Mobile Responsive**: Full touch support and mobile optimization

## Technology Stack

- **Frontend**: React 18, TypeScript, Material-UI
- **Maps**: React-Leaflet, OpenStreetMap
- **Weather**: Open-Meteo API, NOAA GFS
- **Testing**: Jest, React Testing Library
- **Build**: Vite, ESLint, Prettier
- **Deployment**: Static hosting with CDN

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/your-username/blipsim-v2.git
cd blipsim-v2
npm install
npm start
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Project Structure

```
blipsim-v2/
├── app/                    # Main application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── services/       # API services
│   │   └── docs/           # Documentation
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── backlog/                # Project management
│   ├── tasks/             # Task definitions
│   ├── decisions/         # Architecture decisions
│   └── docs/             # Project documentation
├── research/              # Research materials
└── README.md             # This file
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CUSF (Cambridge University Spaceflight) for prediction algorithms
- HabHub for trajectory modeling research
- Open-Meteo for weather data API
- NOAA for additional weather data sources
