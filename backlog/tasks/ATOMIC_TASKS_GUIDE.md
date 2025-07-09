# Atomic Tasks Guide

## Overview
This document outlines the pattern for breaking down large tasks into atomic, manageable units. Each atomic task should be:
- **Focused**: Single responsibility and clear objective
- **Testable**: Specific acceptance criteria
- **Independent**: Can be completed without blocking other tasks
- **Measurable**: Clear definition of done

## Atomic Task Structure

### Template
```markdown
---
id: task-{original}-{subtask}
title: 'Specific focused task'
status: To Do
assignee: []
created_date: '2025-07-08'
updated_date: '2025-07-08'
labels: ['category', 'subcategory']
dependencies: []
priority: high
---

## Description

Clear, focused description of what this task accomplishes.

## Acceptance Criteria
- [ ] Specific, testable criteria
- [ ] Each item is independently verifiable
- [ ] Clear definition of completion
```

### Naming Convention
- Original task: `task-11` → Atomic tasks: `task-11a`, `task-11b`, `task-11c`
- Use descriptive suffixes: `task-11a-ascent-calculation`, `task-11b-descent-calculation`

## Patterns for Breaking Down Tasks

### 1. Research Tasks (task-1)
Break into specific research areas:
- `task-1a` - Research CUSF prediction model
- `task-1b` - Research habhub prediction model  
- `task-1c` - Research NOAA weather data sources

### 2. Requirements Tasks (task-2)
Break into specific requirement categories:
- `task-2a` - Define user inputs and parameters
- `task-2b` - Define system outputs and formats
- `task-2c` - Define technical constraints

### 3. Setup Tasks (task-10)
Break into specific setup areas:
- `task-10a` - Initialize TypeScript React project
- `task-10b` - Install mapping library dependencies
- `task-10c` - Install weather API dependencies
- `task-10d` - Install UI framework dependencies

### 4. Algorithm Tasks (task-11)
Break into specific calculation phases:
- `task-11a` - Implement ascent phase calculation
- `task-11b` - Implement descent phase calculation
- `task-11c` - Implement wind drift calculation

### 5. UI Component Tasks (task-13)
Break into specific UI features:
- `task-13a` - Create basic map component
- `task-13b` - Implement trajectory visualization
- `task-13c` - Implement real-time tracking display

### 6. Layout Tasks (task-19)
Break into specific layout types:
- `task-19a` - Create desktop dashboard layout
- `task-19b` - Create mobile dashboard layout
- `task-19c` - Implement responsive breakpoints

## Remaining Tasks to Atomize

### High Priority
- **task-15** - Implement real-time tracking integration
  - `task-15a` - Setup tracking API client
  - `task-15b` - Implement position data parsing
  - `task-15c` - Create tracking data display

- **task-16** - Create export/import functionality
  - `task-16a` - Implement trajectory export (KML)
  - `task-16b` - Implement trajectory export (GPX)
  - `task-16c` - Implement configuration import
  - `task-16d` - Implement configuration export

- **task-17** - Build prediction accuracy analysis
  - `task-17a` - Implement accuracy metrics calculation
  - `task-17b` - Create accuracy visualization
  - `task-17c` - Add historical accuracy tracking

### Medium Priority
- **task-18** - Implement multi-scenario predictions
- **task-20** - Add offline capabilities
- **task-21** - Implement unit and integration tests
- **task-22** - Setup deployment and hosting
- **task-23** - Create user documentation
- **task-24** - Performance optimization and caching
- **task-25** - Final integration and testing

## Best Practices

1. **Single Responsibility**: Each atomic task should have one clear purpose
2. **Independent Completion**: Tasks should not block each other unnecessarily
3. **Clear Dependencies**: Use the dependencies field to show relationships
4. **Specific Acceptance Criteria**: Each criterion should be testable
5. **Appropriate Labels**: Use labels to categorize and filter tasks
6. **Realistic Scope**: Each task should be completable in 1-3 days

## Task Dependencies

When creating atomic tasks, consider:
- **Technical Dependencies**: What needs to be built first?
- **Data Dependencies**: What data sources are required?
- **UI Dependencies**: What components need to exist first?
- **Integration Dependencies**: What systems need to be connected?

## Example: Breaking Down task-21 (Testing)

```markdown
task-21a - Setup testing framework
task-21b - Write prediction algorithm unit tests
task-21c - Write UI component unit tests
task-21d - Write integration tests for weather API
task-21e - Write integration tests for tracking API
task-21f - Setup end-to-end testing
```

This approach ensures each task is focused, testable, and can be completed independently while maintaining clear relationships between related work. 