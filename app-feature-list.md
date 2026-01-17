# Task & Behavior Tracking App - Feature List

## Overview
An application designed to help users manage daily tasks, track healthy behaviors and habits, monitor time spent on activities, and reflect on their day through customizable assessment questions.

---

## 1. Task Management

### 1.1 Multiple Task Lists
- Create and manage multiple task lists
- Organize tasks by context (daily, work, home, projects, etc.)
- View all lists at a glance

### 1.2 Task List Organization
- **Quick List Creation**: One-tap ability to create new task lists for immediate use
- **Temporary Lists**: Support for short-term lists (errands, room-to-room tasks, location-based)
- **Permanent Lists**: Support for ongoing task lists

### 1.3 Task Movement
- **Easy Task Transfer**: Drag-and-drop or simple button to move tasks between lists
- **Bulk Operations**: Move multiple tasks at once between lists

### 1.4 Backlog Management
- **Archive Incomplete Tasks**: Quick way to move unfinished tasks off the daily list without losing them
- **Backlog List**: Dedicated "someday" or backlog list to preserve tasks for future consideration
- **Backlog Review**: Ability to review and reconsider backlog items anytime
- **Restore Tasks**: Move tasks from backlog back to active lists when ready

### 1.5 Task Details
- Task title/name
- Task description/notes
- Mark complete/incomplete
- Delete tasks

---

## 2. Behavior & Habit Tracking

### 2.1 Trackable Behaviors
Support logging of various daily behaviors including:
- Quick break activities (pushups, squats, curls, meditation, walks)
- Work break exercises
- Health and wellness habits
- Longer daily exercises (running, biking)

### 2.2 Detailed Logging
- **Quantity Tracking**: Log reps, sets, or count of activity
- **Weight/Resistance**: Track weights used in exercises
- **Time of Day**: Record when the activity occurred
- **Multiple Sessions**: Support multiple logging instances per day
- **Daily Totals**: Auto-calculate daily aggregates (e.g., 15 curls AM + 15 curls PM = 30 total)

### 2.3 Quick-Log Interface
- **Non-Intrusive Modal**: Quick-log modal or floating button that doesn't interrupt current workflow
- **Fast Input**: Minimal form fields for rapid data entry
- **Instant Save**: No confirmation steps—save immediately upon entry
- **Auto-Close**: Return to previous view automatically after logging
- **Mid-Activity Logging**: Ability to pause and quickly log activity without switching contexts

### 2.4 Behavior History
- View historical logs of all tracked behaviors
- See trends and patterns over time
- Review past sessions and totals

---

## 3. Activity Timer & Time Tracking

### 3.1 Activity Clock-In/Out
- **Start Activity**: Mark the beginning of a task or project
- **Running Timer**: Display elapsed time for current activity
- **Clock Out**: End the current activity and save duration
- **Separate Tracking**: Activity timer runs independently from task list

### 3.2 Activity Examples
- Making dinner
- Working on a project
- Responding to emails
- Any work or home activity

### 3.3 Pause & Resume
- **Pause Current Activity**: Temporarily stop the timer without ending the activity
- **Switch Activities**: Start a new activity while previous one is paused
- **Resume Previous**: Return to the previous activity with its timer resuming
- **Activity Stack**: Track interruptions and context switches
- **Resume Correct Activity**: When done with interruption, return to the correct prior activity

### 3.4 Time Logs
- Save activity duration data
- Review historical time logs
- See how long activities typically take
- Compare durations over time to identify patterns

---

## 4. Daily Reflection & Assessment

### 4.1 Customizable Reflection Questions
- **Create Questions**: Add custom end-of-day reflection questions
- **Edit Questions**: Modify question text or settings
- **Deactivate Questions**: Stop asking specific questions without deleting history
- **Activate New Questions**: Add new questions to the daily reflection set

### 4.2 Daily Assessment
- **End-of-Day Prompt**: Trigger reflection questions at set time or on-demand
- **Rating Scale**: Rate responses on a 0-10 scale for each question
- **Multiple Questions**: Ask a series of configured questions in one session
- **Response Logging**: Save all responses with timestamp

### 4.3 Reflection History
- **Historical Data**: Keep complete history of all past responses
- **Archived Questions**: Maintain records even for deactivated questions
- **View Trends**: Track scores over time per question
- **Identify Patterns**: Analyze how you're doing on specific life areas

### 4.4 Analytics
- View historical scores for each question
- See trends and patterns in daily reflection scores
- Optional trend analysis and insights

---

## 5. User Interface & Experience

### 5.1 Navigation
- Clean navigation between task lists, behavior tracking, activity timer, and reflections
- Easy switching between different modes without losing context

### 5.2 Dashboard/Home View
- Overview of today's tasks
- Current activity if timer is running
- Quick access to all major features
- Summary of daily behaviors logged

### 5.3 Visual Design
- Responsive design for different screen sizes
- Clear visual hierarchy
- Quick-action buttons for common tasks

---

## 6. Settings & Configuration

### 6.1 Behavior Setup
- Define trackable behaviors and their properties
- Set default units (reps, weight, duration, etc.)

### 6.2 Reflection Question Management
- Create and manage end-of-day questions
- Set timing for daily reflection prompts
- Configure question categories if needed

### 6.3 User Preferences
- Customize app appearance (optional)
- Set preferred units and formats
- Configure notification preferences

---

## 7. Data & Storage

### 7.1 Data Persistence
- Save all tasks across sessions
- Persist behavior logs with timestamps
- Store activity time logs
- Archive reflection responses with timestamps

### 7.2 Data Organization
- Organize data by date
- Enable filtering and searching
- Support historical data review

---

## Implementation Notes

- Prioritize quick-log and fast task management UX to minimize friction
- Design activity timer to work seamlessly with interruptions and context switching
- Ensure backlog system is simple but effective at managing overflow
- Make reflection questions accessible but not burdensome
- Consider mobile-first approach given the nature of quick logging mid-activity
