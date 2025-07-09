#!/bin/bash
# Comprehensive task workflow automation script

set -e

echo "🚀 BLIiPSim Task Workflow Automation"
echo "====================================="

case "$1" in
  "new")
    echo "Creating new task from template..."
    ./new_task.sh
    ;;
  "lint")
    echo "Running task linter..."
    node lint_tasks.js
    ;;
  "fix")
    echo "Adding missing sections to all tasks..."
    node add_missing_sections.js
    node fix_remaining_sections.js
    echo "Running linter to verify..."
    node lint_tasks.js
    ;;
  "reset")
    echo "Resetting all tasks to 'To Do' status..."
    find backlog/tasks -name "*.md" -exec sed -i '' 's/status: Done/status: To Do/g' {} \;
    find backlog/tasks -name "*.md" -exec sed -i '' 's/- \[x\]/- [ ]/g' {} \;
    find backlog/tasks -name "*.md" -exec perl -pi -e 's/✅ \*\*Done\*\*//g' {} \;
    echo "✅ All tasks reset to 'To Do'"
    ;;
  "validate")
    echo "Validating all tasks..."
    node lint_tasks.js
    echo "✅ All tasks validated successfully"
    ;;
  "help"|*)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  new     - Create a new task from template"
    echo "  lint     - Run linter to check task structure"
    echo "  fix      - Add missing sections to all tasks"
    echo "  reset    - Reset all tasks to 'To Do' status"
    echo "  validate - Validate all tasks (alias for lint)"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 new                    # Create new task"
    echo "  $0 lint                   # Check all tasks"
    echo "  $0 fix                    # Fix missing sections"
    echo "  $0 reset                  # Reset all tasks"
    echo "  $0 validate               # Validate task structure"
    ;;
esac 