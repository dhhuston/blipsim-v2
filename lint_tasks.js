#!/usr/bin/env node
// Linter for atomic task markdown files
const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'backlog', 'tasks');
const TEMPLATE = 'TASK_TEMPLATE_OPTIMIZED.md';
const REQUIRED_SECTIONS = [
  '## Description',
  '## Technical Specifications',
  '## Acceptance Criteria',
  '## Testing Requirements',
  '## Performance Requirements',
  '## Error Handling',
  '## Implementation Notes',
  '## Files Created/Modified'
];

// Files to exclude from linting (guides, documentation, etc.)
const EXCLUDED_FILES = [
  'TASK_TEMPLATE_OPTIMIZED.md',
  'ATOMIC_TASKS_GUIDE.md',
  'AI_CODE_CREATION_RECOMMENDATIONS.md',
  'IMPLEMENTATION_SUMMARY.md',
  'PRIORITIZED_TASK_LIST.md'
];

let failed = false;

fs.readdirSync(TASKS_DIR).forEach(file => {
  if (file.endsWith('.md') && !EXCLUDED_FILES.includes(file)) {
    const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8');
    const missing = REQUIRED_SECTIONS.filter(section => !content.includes(section));
    if (missing.length > 0) {
      failed = true;
      console.error(`\n❌ ${file} is missing required sections:`);
      missing.forEach(section => console.error(`   - ${section}`));
    }
  }
});

if (failed) {
  console.error('\nSome tasks are missing required sections. Please fix them before committing.');
  process.exit(1);
} else {
  console.log('✅ All tasks have required sections.');
} 