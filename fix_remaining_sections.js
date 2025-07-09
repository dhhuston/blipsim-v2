#!/usr/bin/env node
// Script to add missing Description and Acceptance Criteria sections
const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'backlog', 'tasks');

const DESCRIPTION_SECTION = `## Description

Clear, focused description of what this task accomplishes in 1-2 sentences.`;

const ACCEPTANCE_CRITERIA_SECTION = `## Acceptance Criteria
- [ ] Specific, testable criteria with clear success metrics
- [ ] Each item is independently verifiable
- [ ] Clear definition of completion
- [ ] Performance benchmarks included
- [ ] Error scenarios covered`;

function addMissingSections() {
  const files = fs.readdirSync(TASKS_DIR);
  
  files.forEach(filename => {
    if (filename.endsWith('.md') && !filename.includes('TEMPLATE') && !filename.includes('GUIDE') && !filename.includes('RECOMMENDATIONS') && !filename.includes('SUMMARY') && !filename.includes('LIST')) {
      const filepath = path.join(TASKS_DIR, filename);
      let content = fs.readFileSync(filepath, 'utf8');
      
      let updated = false;
      
      // Add Description section if missing
      if (!content.includes('## Description')) {
        // Find the first section to insert before
        const firstSectionMatch = content.match(/## [A-Z]/);
        if (firstSectionMatch) {
          const insertIndex = firstSectionMatch.index;
          content = content.slice(0, insertIndex) + DESCRIPTION_SECTION + '\n\n' + content.slice(insertIndex);
        } else {
          // If no sections found, add after the frontmatter
          const frontmatterEnd = content.indexOf('\n---\n', content.indexOf('---'));
          if (frontmatterEnd !== -1) {
            content = content.slice(0, frontmatterEnd + 5) + '\n' + DESCRIPTION_SECTION + '\n\n' + content.slice(frontmatterEnd + 5);
          } else {
            content = DESCRIPTION_SECTION + '\n\n' + content;
          }
        }
        updated = true;
      }
      
      // Add Acceptance Criteria section if missing
      if (!content.includes('## Acceptance Criteria')) {
        // Find a good place to insert (after Description or before Technical Specifications)
        const descIndex = content.indexOf('## Description');
        const techSpecIndex = content.indexOf('## Technical Specifications');
        
        let insertIndex;
        if (descIndex !== -1) {
          // Insert after Description
          const descEnd = content.indexOf('\n', descIndex) + 1;
          insertIndex = descEnd;
        } else if (techSpecIndex !== -1) {
          // Insert before Technical Specifications
          insertIndex = techSpecIndex;
        } else {
          // Insert after Description or at the beginning
          const descIndex = content.indexOf('## Description');
          if (descIndex !== -1) {
            const descEnd = content.indexOf('\n', descIndex) + 1;
            insertIndex = descEnd;
          } else {
            insertIndex = 0;
          }
        }
        
        if (insertIndex > 0) {
          content = content.slice(0, insertIndex) + ACCEPTANCE_CRITERIA_SECTION + '\n\n' + content.slice(insertIndex);
        } else {
          content = ACCEPTANCE_CRITERIA_SECTION + '\n\n' + content;
        }
        updated = true;
      }
      
      if (updated) {
        console.log(`Updated ${filename} with missing sections`);
        fs.writeFileSync(filepath, content);
      }
    }
  });
  
  console.log('✅ Added missing Description and Acceptance Criteria sections.');
}

addMissingSections(); 