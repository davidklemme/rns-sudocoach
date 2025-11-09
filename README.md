# Sudoku Teaching App

An intelligent Sudoku application designed to teach logical thinking and problem-solving skills to players aged 6 and upwards.

## Overview

This app combines puzzle generation, adaptive teaching, and machine learning to provide a personalized Sudoku learning experience. It analyzes player strategies in real-time and provides evolving, age-appropriate feedback.

## Platforms

- **Web**: Deployed on Vercel (Next.js)
- **iOS**: Native SwiftUI app

## Key Features

- 🧩 **Multi-level Puzzles**: 4x4, 6x6, and 9x9 grids with difficulty levels from Beginner to Expert
- 🎓 **Adaptive Teaching**: Personalized explanations based on player skill and game history
- 🤖 **ML-Powered Analysis**: Small, efficient model detects strategies and provides intelligent feedback
- 🎨 **Simple Animations**: Sophisticated yet subtle animations appropriate for all ages
- ♿ **Accessible**: WCAG 2.1 AA compliant, screen reader support, keyboard navigation
- 🌙 **Multiple Themes**: Dark mode, color-blind friendly, reduced motion support
- 📊 **Progress Tracking**: Monitor skill development and strategy mastery

## Documentation

- [**Full Specification**](./SPECIFICATION.md) - Complete project requirements and technical architecture
- [**Todo List**](https://github.com/davidklemme/Sudoku/issues) - Development progress tracker

## Tech Stack

### Web Application
- **Framework**: Next.js 14+ (React, TypeScript)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Hosting**: Vercel
- **Database**: PostgreSQL (Vercel Postgres)
- **Cache**: Redis (Upstash)

### iOS Application
- **Framework**: SwiftUI
- **Minimum iOS**: 16.0+
- **ML**: Core ML

### Machine Learning
- **Training**: Python (TensorFlow/PyTorch)
- **Web Deployment**: TensorFlow.js
- **iOS Deployment**: Core ML

## Development Phases

### Phase 1 (MVP)
- 9x9 Sudoku generation (Easy, Medium, Hard)
- Basic web app with animations
- Manual hint system
- Local storage for progress

### Phase 2
- 4x4 and 6x6 grids for younger players
- ML model integration
- Personalized feedback
- User accounts and cloud sync

### Phase 3
- Advanced teaching system
- Strategy library and tutorials
- iOS app launch
- Enhanced analytics

### Phase 4
- Multiplayer collaborative solving
- Custom puzzle creator
- Adaptive difficulty
- Teacher dashboard for classroom use

## Development Principles

1. **Child-First Design**: Prioritize young learners in every decision
2. **Privacy by Default**: COPPA compliant, minimal data collection
3. **Accessibility**: Usable by all, regardless of ability
4. **Performance**: Fast on low-end devices
5. **Joyful Interactions**: Learning should be fun

## Getting Started

(Instructions will be added as development progresses)

## License

See [LICENSE](./LICENSE) file for details.

## Contact

For questions or feedback, please open an issue on GitHub.

---

*Last Updated: 2025-11-09*
