# Planning Guide

A call center quality assurance platform that transcribes audio files, evaluates agent performance using AI-powered analysis against 10 quality criteria, and provides actionable analytics for coaching and improvement.

**Experience Qualities**:
1. **Efficient** - Streamlined workflow from upload to evaluation with minimal clicks and clear progress indicators
2. **Insightful** - Rich analytics that surface patterns in agent performance, helping managers identify training opportunities quickly
3. **Trustworthy** - Transparent scoring with detailed breakdowns showing exactly why each criterion passed or failed

**Complexity Level**: Light Application (multiple features with basic state)
  - Multiple interconnected features (upload, transcription, evaluation, analytics) with persistent state management for calls and evaluations

## Essential Features

### Audio Upload & Metadata Management
- **Functionality**: Upload audio files with associated call metadata (agent, product, customer details, overdue info)
- **Purpose**: Centralize call recordings with context needed for quality evaluation
- **Trigger**: User clicks upload button or drags files into drop zone
- **Progression**: Select files → Parse metadata (Excel/CSV) → Match file tags → Confirm details → Upload complete
- **Success criteria**: Files successfully stored with metadata linked by file tag, ready for transcription

### AI-Powered Transcript Evaluation
- **Functionality**: Send transcript to Azure OpenAI to evaluate against 10 quality criteria with scoring
- **Purpose**: Automate quality assurance scoring with consistent, objective analysis
- **Trigger**: User initiates evaluation on a transcribed call
- **Progression**: Select call → Generate prompt with evaluation rules → Call Azure OpenAI → Parse structured response → Display scored criteria with examples
- **Success criteria**: Returns scores (0-10) for all 10 criteria with specific examples from transcript justifying each score

### Call List & Detail View
- **Functionality**: Browse all uploaded calls with filtering, search, and detailed view of individual evaluations
- **Purpose**: Allow managers to review historical calls and drill into specific evaluations
- **Trigger**: User navigates to calls list or clicks on specific call
- **Progression**: View list → Apply filters (agent, date, product, score) → Select call → View metadata + transcript + evaluation scores
- **Success criteria**: Fast filtering with persistent state, clear presentation of all call details and scoring

### Agent Performance Analytics
- **Functionality**: Aggregate view of agent performance across multiple calls with trend analysis
- **Purpose**: Identify top performers, coaching opportunities, and performance trends over time
- **Trigger**: User navigates to analytics dashboard
- **Progression**: Load all evaluations → Calculate aggregate metrics → Display charts (average scores by agent, criteria heatmap, trends over time) → Allow drill-down
- **Success criteria**: Clear visualizations showing agent rankings, weakest criteria across team, improvement trends

### Evaluation Criteria Dashboard
- **Functionality**: Visual breakdown showing which quality criteria are most commonly failed across all calls
- **Purpose**: Help identify systemic training gaps and process issues
- **Trigger**: User views analytics section
- **Progression**: Aggregate all evaluations → Calculate pass/fail rates per criterion → Display ranked list with examples
- **Success criteria**: Managers can instantly see "Introduction missing in 35% of calls" and drill into examples

## Edge Case Handling

- **Missing metadata**: Display warning, allow manual entry of agent name, product type before evaluation
- **Transcription errors**: Show confidence score, allow manual transcript editing before evaluation
- **API failures**: Retry logic with exponential backoff, show clear error messages, allow re-evaluation
- **Incomplete audio**: Detect very short files (<30 seconds), flag for manual review
- **Multiple evaluations**: Allow re-evaluation, show version history with timestamp of each evaluation
- **No calls yet**: Empty state with clear CTA to upload first batch of calls

## Design Direction

The design should feel professional and data-driven like a SaaS analytics platform, balancing density of information with clarity - think Datadog or Amplitude but for call center QA. Interface should be rich with charts and tables, optimized for managers who spend extended sessions reviewing multiple calls.

## Color Selection

Triadic color scheme that communicates professionalism, data clarity, and clear status indicators (pass/fail/warning).

- **Primary Color**: Deep Blue `oklch(0.45 0.15 250)` - Professional, trustworthy, used for primary actions and headers
- **Secondary Colors**: Slate Gray `oklch(0.55 0.02 250)` for secondary UI elements and muted backgrounds
- **Accent Color**: Vibrant Cyan `oklch(0.70 0.15 200)` - Highlights key metrics and interactive elements
- **Success/Warning/Error**: Green `oklch(0.65 0.17 145)` for passed criteria, Amber `oklch(0.75 0.15 85)` for warnings, Red `oklch(0.60 0.22 25)` for failed criteria
- **Foreground/Background Pairings**:
  - Background (White `oklch(1 0 0)`): Foreground `oklch(0.25 0.02 250)` - Ratio 12.5:1 ✓
  - Card (Light Gray `oklch(0.98 0.005 250)`): Foreground `oklch(0.25 0.02 250)` - Ratio 11.8:1 ✓
  - Primary (Deep Blue `oklch(0.45 0.15 250)`): White `oklch(1 0 0)` - Ratio 7.2:1 ✓
  - Accent (Cyan `oklch(0.70 0.15 200)`): Dark Blue `oklch(0.25 0.08 250)` - Ratio 6.8:1 ✓
  - Success (Green `oklch(0.65 0.17 145)`): Dark `oklch(0.20 0.02 145)` - Ratio 8.5:1 ✓

## Font Selection

Typography should convey precision and professionalism with excellent readability for dense data tables and long transcript reading sessions. Use Inter for its geometric clarity and exceptional screen rendering.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Bold/32px/tight (-0.02em) - Main dashboard headers
  - H2 (Section Title): Inter Semibold/24px/tight (-0.01em) - Card headers, modal titles
  - H3 (Subsection): Inter Medium/18px/normal - Criteria names, table headers
  - Body (Content): Inter Regular/15px/relaxed (1.6) - Transcripts, descriptions
  - Small (Metadata): Inter Regular/13px/normal - Timestamps, tags, secondary info
  - Mono (Scores): Inter Medium/20px/tight - Large numerical scores displayed prominently

## Animations

Animations should be subtle and purposeful, primarily reinforcing data updates and state changes without distracting from the information-dense interface.

- **Purposeful Meaning**: Use gentle transitions when switching between calls to maintain spatial context, smooth chart animations when filters change to show data continuity
- **Hierarchy of Movement**: Score updates and evaluations should have satisfying completion animations (progress bar → checkmark), while navigation should be instantaneous

## Component Selection

- **Components**: 
  - `Table` for call lists with sortable columns and row selection
  - `Card` for metric displays and evaluation criteria breakdown
  - `Badge` for status indicators (Evaluated, Pending, Failed)
  - `Tabs` for switching between Calls, Analytics, and Agents views
  - `Dialog` for upload flow and detailed evaluation view
  - `Progress` for evaluation loading states
  - `Select` for filtering by agent, product, date range
  - `Input` for search and manual transcript editing
  - `Textarea` for displaying full transcripts
  - `Separator` to divide sections within evaluation details
  - `ScrollArea` for long transcripts and call lists

- **Customizations**: 
  - Custom score visualization component showing 0-10 scale with color-coded segments
  - Custom criteria checklist component with expandable examples
  - Custom file upload zone with drag-and-drop and Excel parsing
  - Analytics charts using recharts with consistent color scheme

- **States**: 
  - Buttons: Primary (Evaluate Call) has filled state, Secondary (Export) has outline
  - Table rows: Hover shows light background, selected shows accent border
  - Cards: Subtle shadow on hover for interactive cards
  - Evaluation status badges: Color-coded with icons (✓ for passed, ✗ for failed)

- **Icon Selection**: 
  - `Upload` for file upload actions
  - `ListChecks` for evaluation criteria
  - `ChartBar` for analytics navigation
  - `User` for agent profiles
  - `Phone` for call records
  - `CheckCircle`/`XCircle` for pass/fail indicators
  - `TrendingUp`/`TrendingDown` for performance trends

- **Spacing**: 
  - Page padding: `p-8` for main content areas
  - Card padding: `p-6` for content cards
  - Section gaps: `gap-6` between major sections
  - Table padding: `px-4 py-3` for cell content
  - Button padding: `px-4 py-2` for standard buttons

- **Mobile**: 
  - Stack table columns vertically into card-like items on mobile
  - Tabs convert to bottom sheet navigation
  - Charts adjust to single column layout with swipeable carousel
  - Upload dialog takes full screen on mobile with clear step indicators
  - Filters collapse into drawer accessible via hamburger menu
