# Sudoku Teaching App - Specification

## Project Overview

An intelligent Sudoku application designed to teach logical thinking and problem-solving skills to players aged 6 and upwards. The app generates puzzles at varying difficulty levels and uses ML-powered analysis to provide personalized, evolving feedback on player strategies.

**Platforms**:
- Web (deployed on Vercel)
- iOS (native app)

---

## Target Audience

- **Primary**: Children aged 6-12 years
- **Secondary**: Teenagers and adults interested in learning Sudoku strategies
- **Accessibility**: Simple, intuitive interface suitable for young learners
- **Progression**: Adaptive difficulty that grows with player skill

---

## Core Features

### 1. Puzzle Generation System

**Difficulty Levels**:
- **Beginner** (ages 6-8): 4x4 grids, pre-filled hints, visual cues
- **Easy** (ages 8-10): 6x6 grids, moderate hints
- **Medium** (ages 10+): 9x9 grids, standard Sudoku
- **Hard** (ages 12+): 9x9 grids, minimal clues
- **Expert** (advanced players): Complex patterns requiring advanced strategies

**Generation Requirements**:
- Guaranteed unique solution for every puzzle
- Balanced distribution of numbers
- Solvable using logical deduction (no guessing required for Easy-Medium)
- Seed-based generation for reproducibility

### 2. Teaching & Explanation System

**Adaptive Teaching**:
- Real-time hints based on current game state
- Post-game analysis explaining key moves
- Strategy identification and naming (e.g., "Hidden Singles", "Naked Pairs")
- Progressive concept introduction based on player level

**Explanation Types**:
- **Visual**: Highlight related cells, show number conflicts
- **Textual**: Age-appropriate explanations (simple language for younger players)
- **Interactive**: "Why?" button for any move to get explanation
- **Video/Animation**: Short clips demonstrating techniques

**Teaching Concepts** (Progressive):
1. Basic rules (rows, columns, boxes)
2. Elimination technique
3. Single candidate identification
4. Hidden singles
5. Naked pairs/triples
6. Pointing pairs
7. Box/line reduction
8. X-Wing pattern
9. Advanced techniques (for older players)

### 3. Player Analytics & Tracking

**Metrics to Track**:
- Time per puzzle (overall and per cell)
- Moves made (correct/incorrect)
- Hint usage frequency
- Strategy patterns used
- Error patterns (repeated mistakes)
- Progression over time
- Preferred difficulty levels

**Strategy Detection**:
- Identify which solving techniques player uses
- Detect if player is guessing vs. using logic
- Track strategy evolution over time
- Identify gaps in understanding

### 4. ML Model for Strategy Analysis

**Model Purpose**:
- Classify player moves into strategy categories
- Predict player skill level
- Identify teaching opportunities
- Detect struggling patterns requiring intervention

**Execution Model**:
- **Client-Side Only**: Runs entirely in browser (TensorFlow.js) or on device (Core ML)
- **Async/Background**: Analysis happens without blocking gameplay
- **Non-Intrusive**: Player continues playing while feedback is prepared
- **Progressive Disclosure**: Insights appear when ready (e.g., subtle notification badge)

**Model Specifications**:
- **Type**: Small, efficient neural network (deployable on client-side)
- **Input Features**:
  - Board state before move
  - Cell selected
  - Number placed
  - Time taken for move
  - Recent move history (sequence)
  - Available candidates in cell
  - Board completion percentage

- **Output**:
  - Strategy category (0-10+ classes)
  - Confidence score
  - Difficulty appropriateness
  - Suggested teaching moment flag

**Training Data**:
- Expert-labeled move sequences
- Crowd-sourced player data (anonymized)
- Synthetic data from puzzle generators
- Initial dataset: ~10,000 labeled moves across difficulty levels

**Model Size**:
- Target: < 5MB for web deployment
- Architecture: Lightweight (MobileNet-style or transformer-lite)
- Framework: TensorFlow.js (web) / Core ML (iOS)

**Performance Targets**:
- Inference time: < 50ms per move (async, non-blocking)
- Accuracy: > 85% for common strategies
- Runs smoothly on 3+ year old devices

### 5. Feedback System

**Immediate Feedback**:
- Visual confirmation for correct moves (subtle animation)
- Gentle error indication (no harsh red X)
- Contextual hints on demand

**Evolving Feedback**:
- Personalized based on player history
- Adapts complexity of explanations to demonstrated understanding
- Reduces scaffolding as player improves
- Celebrates milestone achievements

**Progress Tracking**:
- Unlock new difficulty levels
- Strategy mastery indicators
- Personal best times
- Skill progression charts

---

## Technical Architecture

### Frontend (Web)

**Framework**: Next.js 14+ (React)
**Styling**: Tailwind CSS + Framer Motion (animations)
**State Management**: Zustand or Jotai (lightweight)
**Features**:
- Server-side rendering for SEO
- Progressive Web App (PWA) capabilities
- Responsive design (mobile-first)
- Offline play support

### Frontend (iOS)

**Framework**: SwiftUI
**Minimum iOS**: 16.0+
**Features**:
- Native animations (SwiftUI animations)
- Haptic feedback
- iCloud sync (optional)
- Share progress with friends

### Backend

**Hosting**: Vercel (serverless functions)
**Database**:
- PostgreSQL (Vercel Postgres or Supabase) for user data
- Redis for caching generated puzzles

**API Endpoints**:
- `/api/puzzle/generate` - Generate new puzzle
- `/api/puzzle/validate` - Validate solution
- `/api/analytics/track` - Track player moves
- `/api/user/progress` - Get/update user progress
- `/api/ml/analyze` - Analyze move strategy
- `/api/teaching/explain` - Get contextual explanation

### ML Model

**Development**: Python (TensorFlow/PyTorch)
**Deployment**:
- TensorFlow.js (web)
- Core ML (iOS)
**Training Pipeline**: Jupyter notebooks → Converted model
**Version Control**: Model versioning with metadata

### Data Storage

**User Profile**:
- Anonymous ID (GDPR-compliant)
- Age range (for appropriate difficulty)
- Skill level
- Preferences (sound, animations)

**Game History**:
- Puzzle ID
- Move sequence (for replay)
- Time taken
- Strategies used
- Final state (completed/abandoned)

**Privacy**:
- COPPA compliant (children under 13)
- Optional parent account for kids
- No personal data collection from children
- Data encryption at rest

---

## UI/UX Requirements

### Visual Design

**Color Palette**:
- Soft, age-appropriate colors (avoid harsh contrasts)
- High contrast mode for accessibility
- Color-blind friendly palette
- Dark mode support

**Typography**:
- Large, readable fonts (minimum 16px for numbers)
- Dyslexia-friendly font option (OpenDyslexic)
- Clear visual hierarchy

**Grid Design**:
- Clear cell boundaries
- Visual distinction for 3x3 boxes (subtle background)
- Selected cell highlight
- Related cells highlight (same row/column/box)
- Conflicting cells indication

### Animations

**Principles**:
- **Simple but sophisticated**: Subtle, purposeful animations
- **Performance**: 60 FPS on all target devices
- **Accessibility**: Respect reduced motion preferences

**Animation Types**:
- Number entry (gentle scale/fade)
- Correct move confirmation (brief glow)
- Error indication (subtle shake)
- Hint reveal (animated highlight)
- Puzzle completion celebration (confetti)
- Strategy explanation (animated arrows/highlights)
- Level unlock (badge animation)

**Timing**:
- Most animations: 200-300ms
- Celebration: 1-2s
- Explanation animations: 500-1000ms (allow time to understand)

### Interaction Design

**Input Methods**:
- Touch/click on cell + number pad
- Keyboard input (web)
- Pencil marks (candidates) toggle
- Undo/redo functionality
- Erase button

**Teaching Moments**:
- "?" button always accessible
- Non-intrusive tip overlays
- Optional tutorial mode for first-time users
- "Teach me" mode vs. "Practice" mode

---

## ML Model Testing Strategy

### Test Stories for Model Validation

To ensure the ML model accurately detects strategies and provides appropriate feedback, we'll use the following test stories:

#### Story 1: Naked Single Detection (Beginner)
**Scenario**: Player is working on an easy 9x9 puzzle. Cell (4,5) has only one possible candidate: 7.
**Expected Behavior**:
- Player places 7 in cell (4,5)
- Model classifies as "Single Candidate" (confidence > 90%)
- Feedback: "Great! You found the only number that could go there."

**Test Variations**:
- 4x4 grid with single candidate
- 6x6 grid with single candidate
- Multiple consecutive single candidates

#### Story 2: Hidden Single Detection (Intermediate)
**Scenario**: In row 3, the number 8 can only go in cell (3,6) due to constraints from other rows/columns.
**Expected Behavior**:
- Player places 8 in cell (3,6)
- Model classifies as "Hidden Single" (confidence > 80%)
- Feedback: "Nice work! You found where 8 had to go in this row."

**Test Variations**:
- Hidden single in column
- Hidden single in box
- Multiple hidden singles in different regions

#### Story 3: Naked Pair Strategy (Advanced)
**Scenario**: Cells (2,3) and (2,7) both have only candidates {4,9}. This eliminates 4 and 9 from other cells in row 2.
**Expected Behavior**:
- Player eliminates 4 or 9 from another cell in row 2
- Model classifies as "Naked Pair" (confidence > 75%)
- Feedback: "Excellent! You used a Naked Pair to eliminate possibilities."

**Test Variations**:
- Naked pair in column
- Naked pair in box
- Naked triple detection

#### Story 4: Guessing vs. Logical Deduction
**Scenario**: Player places a number in a cell that has multiple valid candidates without using clear logic.
**Expected Behavior**:
- Model detects low confidence in strategy classification
- Flags as "Guessing" or "Uncertain"
- Feedback: "Are you sure? Try looking for cells with fewer options first."

**Test Variations**:
- Early guess (board <30% complete)
- Late guess (board >70% complete)
- Guess that happens to be correct vs. incorrect

#### Story 5: Progressive Learning Detection
**Scenario**: Player completes 10 puzzles over 5 days. Initially uses only basic strategies, gradually incorporates hidden singles.
**Expected Behavior**:
- Model tracks strategy usage over time
- Detects increased use of "Hidden Single"
- Adaptive feedback reduces scaffolding for mastered strategies
- Suggests next strategy to learn ("Ready to try Naked Pairs?")

**Test Metrics**:
- Strategy diversity score increases
- Average difficulty level progresses
- Time per puzzle decreases for same difficulty

#### Story 6: Age-Appropriate Feedback (6-year-old)
**Scenario**: Young child working on 4x4 puzzle, places correct number using elimination.
**Expected Behavior**:
- Model detects "Elimination" strategy
- Feedback uses simple language: "You did it! That was the only number left."
- Visual feedback: Animated checkmark, gentle glow

**Test Variations**:
- Different age groups (6-8, 9-12, 13+)
- Complexity of language adjusts
- Visual vs. text emphasis

#### Story 7: Struggling Player Detection
**Scenario**: Player makes 3 incorrect moves in a row, time between moves increases.
**Expected Behavior**:
- Model detects distress pattern
- Offers contextual hint without revealing answer
- Suggestion: "Would you like a hint about this row?"

**Test Variations**:
- Multiple errors in same region
- Long pause (>60 seconds) on single cell
- Repeated undo actions

#### Story 8: Expert Player Recognition
**Scenario**: Player consistently uses advanced strategies (X-Wing, Y-Wing) and completes puzzles quickly.
**Expected Behavior**:
- Model detects high proficiency
- Reduces teaching interventions
- Unlocks "Expert" difficulty
- Feedback: Minimal, celebration-focused

**Test Metrics**:
- Strategy classification accuracy for advanced patterns
- Appropriate difficulty suggestions
- Low false-positive rate on teaching moments

#### Story 9: Async Feedback Timing
**Scenario**: Player makes move, immediately starts thinking about next move. ML analysis completes 30ms later.
**Expected Behavior**:
- Move is immediately reflected on board (no blocking)
- Analysis runs in background (Web Worker / separate thread)
- Feedback badge appears when ready (if teaching moment detected)
- Player can click badge when ready, or ignore and continue

**Performance Tests**:
- Measure inference time across devices (target: <50ms)
- Test on low-end devices (3-year-old phones/tablets)
- Verify smooth gameplay (60 FPS maintained)

#### Story 10: Multi-Strategy Move
**Scenario**: A move could be classified as both "Hidden Single" and "Elimination" (overlapping strategies).
**Expected Behavior**:
- Model outputs probability distribution across strategies
- Selects highest confidence classification
- If confidence <70%, labels as "Mixed Strategy"
- Explanation highlights multiple approaches

**Test Cases**:
- Compare multi-label vs. single-label approach
- Verify explanation quality for ambiguous moves

### Model Testing Infrastructure

**Automated Tests**:
- Unit tests for preprocessing functions
- Integration tests with known game scenarios
- Regression tests when model is updated

**Test Data Sets**:
- **Benchmark Set**: 1,000 expert-labeled moves across all strategies
- **Edge Cases**: 200 ambiguous or challenging moves
- **Performance Set**: 10,000 moves for speed testing

**Success Criteria**:
- **Accuracy**: >85% on benchmark set
- **Latency**: <50ms inference time (p95)
- **Size**: <5MB model file
- **Consistency**: >95% same classification for identical board states

**A/B Testing** (Post-Launch):
- Test model versions with real users
- Measure engagement and learning outcomes
- Iterate based on aggregated feedback

---

## Feature Roadmap

### MVP (Phase 1)
- 9x9 Sudoku generation (Easy, Medium, Hard)
- Basic web app (Next.js on Vercel)
- Simple UI with animations
- Manual hint system (no ML)
- Local storage for progress

### Phase 2
- 4x4 and 6x6 grids for younger players
- ML model integration (strategy detection)
- Personalized feedback system
- User accounts and progress tracking
- iOS app development starts

### Phase 3
- Advanced teaching system with explanations
- Strategy library and tutorials
- Social features (share puzzles)
- iOS app launch
- Enhanced analytics dashboard

### Phase 4
- Multiplayer mode (collaborative solving)
- Custom puzzle creator
- Adaptive difficulty (auto-adjusts)
- Gamification (achievements, streaks)
- Teacher dashboard (for classroom use)

---

## Technical Constraints

**Performance**:
- Puzzle generation: < 2 seconds
- ML inference: < 100ms per move
- Page load time: < 2 seconds
- Animation frame rate: 60 FPS

**Accessibility**:
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Voice control compatibility (iOS)

**Browser Support**:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

**Device Support**:
- iOS 16.0+
- Modern browsers on desktop/tablet
- Responsive: 320px to 4K displays

---

## Success Metrics

**Engagement**:
- Daily active users
- Average session duration (target: 15+ minutes)
- Puzzle completion rate (target: 70%+)
- Return rate (target: 3+ sessions/week)

**Learning**:
- Skill progression (difficulty level advancement)
- Strategy diversity (number of different strategies used)
- Hint dependency reduction over time
- Error rate reduction

**Technical**:
- ML model accuracy (target: 85%+ for strategy classification)
- App performance (< 2s load time)
- Crash rate (< 0.1%)

---

## Development Principles

1. **Child-First Design**: Every decision prioritizes young learners
2. **Progressive Enhancement**: Works without JS, better with it
3. **Privacy by Default**: Minimal data collection, COPPA compliant
4. **Accessibility**: Usable by all, regardless of ability
5. **Performance**: Fast on low-end devices
6. **Iterative Learning**: App improves as it learns from users
7. **Joyful Interactions**: Learning should be fun, not frustrating

---

## Open Questions / Future Considerations

1. **Localization**: Multiple languages from start or later?
2. **Monetization**: Free with optional premium? Ads (if so, child-safe)?
3. **Offline Mode**: Full offline support vs. online-only?
4. **Social Features**: Compete with friends? Leaderboards?
5. **Curriculum Alignment**: Align with math standards (Common Core, etc.)?
6. **Research Partnership**: Collaborate with educators for validation?
7. **Variant Support**: Include Sudoku variants (Killer, Samurai, etc.)?

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| **Web Frontend** | Next.js 14, React 18, TypeScript |
| **Web Styling** | Tailwind CSS, Framer Motion |
| **iOS App** | SwiftUI, Combine |
| **Backend** | Vercel Serverless Functions |
| **Database** | PostgreSQL (Vercel Postgres) |
| **Cache** | Redis (Upstash) |
| **ML Training** | Python, TensorFlow/PyTorch |
| **ML Deployment** | TensorFlow.js (web), Core ML (iOS) |
| **Analytics** | Custom tracking + Vercel Analytics |
| **Auth** | NextAuth.js (optional accounts) |
| **Testing** | Jest, React Testing Library, Playwright |
| **CI/CD** | GitHub Actions, Vercel auto-deploy |

---

*Document Version: 1.0*
*Last Updated: 2025-11-09*
