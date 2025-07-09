#!/bin/bash
# Script to create a new atomic task from the template
set -e
TEMPLATE="backlog/tasks/TASK_TEMPLATE_OPTIMIZED.md"
TASKS_DIR="backlog/tasks"

read -p "Enter new task filename (e.g., task-99a - My-new-task.md): " TASKNAME
NEWFILE="$TASKS_DIR/$TASKNAME"

if [ -f "$NEWFILE" ]; then
  echo "Error: $NEWFILE already exists!"
  exit 1
fi

cp "$TEMPLATE" "$NEWFILE"
echo "Created $NEWFILE from template."

# Optionally open in VSCode if available
if command -v code &> /dev/null; then
  code "$NEWFILE"
fi 