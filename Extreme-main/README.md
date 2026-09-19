# Xtreme Car Care – Premium Car Detailing & Restoration

## Project Overview

Xtreme Car Care is a premium car detailing and restoration studio based in Chennai, offering world-class services including ceramic coating, paint protection film (PPF), and expert restoration. This is a modern web application built with React, TypeScript, and Tailwind CSS.

## Tech Stack

This project is built with:

- **Vite** – Fast build tool and development server
- **TypeScript** – Type-safe JavaScript
- **React** – UI library
- **React Router** – Client-side routing
- **shadcn/ui** – High-quality UI components
- **Tailwind CSS** – Utility-first CSS framework
- **Tanstack React Query** – Data fetching and caching
- **React Hook Form** – Form state management
- **Zod** – Schema validation

## Getting Started

### Prerequisites

Make sure you have Node.js (v18+) and npm (or yarn/bun) installed.

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd Extreme-main
```

2. Install dependencies:
```sh
npm install
```

3. Start the development server:
```sh
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run build:dev` – Build in development mode
- `npm run preview` – Preview production build
- `npm run lint` – Run ESLint
- `npm run test` – Run tests once
- `npm run test:watch` – Run tests in watch mode

## Project Structure

```
src/
├── assets/          # Images and static assets
├── components/      # React components
│   └── ui/         # shadcn/ui component library
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
├── test/           # Test files
├── App.tsx         # Main App component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## Deployment

The project is configured for deployment to Vercel. See `vercel.json` for configuration.

To deploy:

1. Push your changes to the main branch
2. Vercel will automatically build and deploy

Alternatively, build and deploy manually:

```sh
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## Development Guidelines

- Follow the existing code style and structure
- Use TypeScript for type safety
- Keep components modular and reusable
- Write tests for critical functionality
- Use Tailwind CSS for styling

## Contributing

For changes and improvements:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions, please open an issue in the repository.
