#!/usr/bin/env node
// Script to add missing sections to all task files
const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, 'backlog', 'tasks');

// Standard sections to add
const STANDARD_SECTIONS = {
  'Technical Specifications': `## Technical Specifications

### Data Models
\`\`\`typescript
interface TaskInput {
  // Define input parameters
}

interface TaskOutput {
  // Define output structure
}
\`\`\`

### File Structure
\`\`\`
components/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── ComponentName.css
\`\`\`

### Integration Points
- Connect to {existing component} for {data flow}
- Integrate with {service} for {functionality}
- Update {main app} to include component`,

  'Testing Requirements': `## Testing Requirements
- Unit tests for each {function/component} method
- Integration tests with mock {data/API} responses
- Performance tests for {large datasets/concurrent requests}
- Error handling tests for {specific failure modes}
- Edge case testing ({extreme values/missing data})
- End-to-end tests with real {APIs/user interactions}`,

  'Performance Requirements': `## Performance Requirements
- {Operation} time < {X}ms for typical {scenarios}
- Memory usage < {X}MB for {large datasets}
- {API} calls limited to {X} per {time period}
- Bundle size increase < {X}KB ({dependencies})
- {UI} interactions maintain {X}fps`,

  'Error Handling': `## Error Handling
- Graceful degradation when {service} unavailable
- Retry logic for {transient failures} ({X} attempts)
- Timeout protection for {slow operations} ({X}s)
- Validation for {input types} with clear error messages
- Fallback behavior for {missing data scenarios}`,

  'Implementation Notes': `## Implementation Notes
- Implement in \`{file path}\` using {technology/framework}
- Follow {design pattern/architecture} for consistency
- Use {state management} for {data flow}
- Include {accessibility features} for {user types}
- Support {responsive design} for {device types}`,

  'Files Created/Modified': `## Files Created/Modified
- \`{file path}\` - {purpose and key features}
- \`{file path}\` - {test coverage and scenarios}
- \`{file path}\` - {styling and theming}
- \`{file path}\` - {integration and updates}`
};

// Special sections for different task types
const TASK_TYPE_SECTIONS = {
  'research': {
    'Technical Specifications': `## Technical Specifications

### Research Scope
- Primary sources to investigate
- Secondary sources for validation
- Evaluation criteria and metrics
- Documentation requirements

### Research Methodology
- Systematic review approach
- Data collection methods
- Analysis framework
- Validation process`,

    'Testing Requirements': `## Testing Requirements
- Validate research findings against multiple sources
- Cross-reference with existing implementations
- Document limitations and assumptions
- Peer review of research conclusions`,

    'Performance Requirements': `## Performance Requirements
- Research completion within {X} hours
- Documentation quality standards
- Source verification requirements
- Knowledge transfer effectiveness`,

    'Error Handling': `## Error Handling
- Handle unavailable or outdated sources
- Address conflicting information
- Manage incomplete data
- Document research gaps and limitations`,

    'Implementation Notes': `## Implementation Notes
- Document findings in \`{file path}\`
- Create summary report with key insights
- Identify actionable recommendations
- Plan knowledge transfer to development team`,

    'Files Created/Modified': `## Files Created/Modified
- \`{research file}\` - Research findings and analysis
- \`{summary file}\` - Executive summary and recommendations
- \`{documentation file}\` - Technical documentation and references`
  },

  'setup': {
    'Technical Specifications': `## Technical Specifications

### Setup Requirements
- Required dependencies and versions
- Configuration parameters
- Environment setup steps
- Integration requirements

### Setup Process
- Step-by-step installation
- Configuration validation
- Testing setup completion
- Documentation requirements`,

    'Testing Requirements': `## Testing Requirements
- Verify all dependencies installed correctly
- Test configuration parameters
- Validate environment setup
- Confirm integration with existing systems`,

    'Performance Requirements': `## Performance Requirements
- Setup completion within {X} minutes
- Minimal impact on existing systems
- Efficient resource utilization
- Scalable configuration approach`,

    'Error Handling': `## Error Handling
- Handle dependency conflicts
- Manage installation failures
- Address configuration errors
- Provide rollback procedures`,

    'Implementation Notes': `## Implementation Notes
- Follow setup checklist in \`{setup file}\`
- Document configuration in \`{config file}\`
- Update environment variables
- Test setup with sample data`,

    'Files Created/Modified': `## Files Created/Modified
- \`{setup file}\` - Setup instructions and checklist
- \`{config file}\` - Configuration parameters
- \`{env file}\` - Environment variables
- \`{test file}\` - Setup validation tests`
  },

  'algorithm': {
    'Technical Specifications': `## Technical Specifications

### Data Models
\`\`\`typescript
interface AlgorithmInput {
  // Input parameters with exact types
  param1: number;      // units
  param2: string;      // description
  param3: boolean;     // optional flag
}

interface AlgorithmOutput {
  // Output structure
  result: number;      // primary result
  confidence: number;  // confidence level 0-1
  metadata: object;    // additional data
}
\`\`\`

### File Structure
\`\`\`
algorithms/
├── algorithmName.ts
├── algorithmName.test.ts
└── types/
    └── algorithmName.ts
\`\`\`

### Integration Points
- Connect to \`predictionEngine.ts\` for orchestration
- Integrate with \`{existing algorithm}\` for {data flow}
- Update \`{main service}\` to use new algorithm
- Connect to \`{data source}\` for input data`,

    'Testing Requirements': `## Testing Requirements
- Unit tests for each algorithm function
- Integration tests with mock data
- Performance tests for large datasets
- Error handling tests for invalid inputs
- Edge case testing (extreme values, boundary conditions)
- End-to-end tests with real data`,

    'Performance Requirements': `## Performance Requirements
- Calculation time < {X}ms for typical inputs
- Memory usage < {X}MB for large datasets
- Support for {specific constraints}
- Scalable to {X} concurrent operations`,

    'Error Handling': `## Error Handling
- Validation for input parameter ranges
- Graceful handling of invalid data
- Fallback behavior for edge cases
- Timeout protection for long calculations`,

    'Implementation Notes': `## Implementation Notes
- Implement in \`app/src/algorithms/{algorithmName}.ts\`
- Use {mathematical approach} for calculations
- Integrate with existing algorithms for consistency
- Include comprehensive error handling
- Optimize for performance and accuracy`,

    'Files Created/Modified': `## Files Created/Modified
- \`app/src/algorithms/{algorithmName}.ts\` - Main algorithm implementation
- \`app/src/algorithms/{algorithmName}.test.ts\` - Comprehensive test suite
- \`app/src/types/prediction.ts\` - Updated with algorithm types
- \`app/src/algorithms/predictionEngine.ts\` - Integration with main engine`
  },

  'component': {
    'Technical Specifications': `## Technical Specifications

### Data Models
\`\`\`typescript
interface ComponentProps {
  // Props interface
  requiredProp: string;
  optionalProp?: number;
  onEvent?: (data: any) => void;
}

interface ComponentState {
  // State interface
  isLoading: boolean;
  data: any[];
  error?: string;
}
\`\`\`

### File Structure
\`\`\`
components/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── ComponentName.css
\`\`\`

### Integration Points
- Connect to \`{parent component}\` for {data flow}
- Integrate with \`{service}\` for {functionality}
- Update \`App.tsx\` to include component
- Connect to \`{state management}\` for data`,

    'Testing Requirements': `## Testing Requirements
- Unit tests for component rendering
- Integration tests with mock data
- Performance tests for user interactions
- Error handling tests for invalid props
- Edge case testing (empty data, loading states)
- End-to-end tests with real user interactions`,

    'Performance Requirements': `## Performance Requirements
- Component rendering < {X}ms for typical props
- Memory usage < {X}MB for large datasets
- Smooth interactions ({X}fps)
- Bundle size increase < {X}KB ({dependencies})`,

    'Error Handling': `## Error Handling
- Graceful degradation when props invalid
- Loading states for async operations
- Error boundaries for component failures
- Fallback UI for missing data`,

    'Implementation Notes': `## Implementation Notes
- Implement in \`app/src/components/{ComponentName}.tsx\`
- Use Material-UI components for consistency
- Include responsive design for mobile/desktop
- Add accessibility features (ARIA labels, keyboard nav)
- Follow existing component patterns`,

    'Files Created/Modified': `## Files Created/Modified
- \`app/src/components/{ComponentName}.tsx\` - Main component implementation
- \`app/src/components/{ComponentName}.test.tsx\` - Comprehensive test suite
- \`app/src/components/{ComponentName}.css\` - Component-specific styling
- \`app/src/App.tsx\` - Integration with main application`
  },

  'service': {
    'Technical Specifications': `## Technical Specifications

### Data Models
\`\`\`typescript
interface ServiceConfig {
  // Configuration interface
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface ServiceResponse {
  // Response interface
  data: any;
  status: number;
  error?: string;
}
\`\`\`

### File Structure
\`\`\`
services/
├── serviceName.ts
├── serviceName.test.ts
└── types/
    └── serviceName.ts
\`\`\`

### API Integration
- **Endpoint**: \`{baseUrl}/{endpoint}\`
- **Method**: {HTTP_METHOD}
- **Authentication**: {auth_type}
- **Rate Limit**: {X} requests per {time}`,

    'Testing Requirements': `## Testing Requirements
- Unit tests for service methods
- Integration tests with mock API responses
- Performance tests for concurrent requests
- Error handling tests for network failures
- Edge case testing (timeout, rate limiting)
- End-to-end tests with real API calls`,

    'Performance Requirements': `## Performance Requirements
- API response time < {X}s for typical requests
- Memory usage < {X}MB for data caching
- Rate limiting: {X} requests per {time period}
- Bundle size increase < {X}KB ({dependencies})`,

    'Error Handling': `## Error Handling
- Graceful degradation when API unavailable
- Retry logic for transient failures ({X} attempts)
- Timeout protection for slow responses ({X}s)
- Fallback behavior for missing data`,

    'Implementation Notes': `## Implementation Notes
- Implement in \`app/src/services/{serviceName}.ts\`
- Use axios for HTTP requests with timeout configuration
- Include retry logic and rate limiting
- Cache responses to reduce API calls
- Handle errors gracefully with user feedback`,

    'Files Created/Modified': `## Files Created/Modified
- \`app/src/services/{serviceName}.ts\` - Main service implementation
- \`app/src/services/{serviceName}.test.ts\` - Comprehensive test suite
- \`app/src/types/{serviceName}.ts\` - Service type definitions
- \`app/src/services/__mocks__/{serviceName}.ts\` - Mock for testing`
  }
};

function determineTaskType(filename) {
  const content = fs.readFileSync(path.join(TASKS_DIR, filename), 'utf8');
  const title = content.match(/title: '([^']+)'/)?.[1] || '';
  
  if (title.includes('Research') || title.includes('research')) return 'research';
  if (title.includes('Setup') || title.includes('Install') || title.includes('Initialize')) return 'setup';
  if (title.includes('Implement') && (title.includes('algorithm') || title.includes('calculation') || title.includes('prediction'))) return 'algorithm';
  if (title.includes('Create') && (title.includes('component') || title.includes('input') || title.includes('display'))) return 'component';
  if (title.includes('Setup') && title.includes('API') || title.includes('service')) return 'service';
  
  // Default to component for UI tasks, service for API tasks, algorithm for calculation tasks
  if (title.includes('input') || title.includes('component') || title.includes('display')) return 'component';
  if (title.includes('API') || title.includes('service') || title.includes('integration')) return 'service';
  if (title.includes('calculation') || title.includes('algorithm') || title.includes('prediction')) return 'algorithm';
  
  return 'component'; // Default fallback
}

function addMissingSections() {
  const files = fs.readdirSync(TASKS_DIR);
  
  files.forEach(filename => {
    if (filename.endsWith('.md') && !filename.includes('TEMPLATE') && !filename.includes('GUIDE') && !filename.includes('RECOMMENDATIONS') && !filename.includes('SUMMARY') && !filename.includes('LIST')) {
      const filepath = path.join(TASKS_DIR, filename);
      let content = fs.readFileSync(filepath, 'utf8');
      
      const taskType = determineTaskType(filename);
      const sectionsToAdd = TASK_TYPE_SECTIONS[taskType] || STANDARD_SECTIONS;
      
      // Check which sections are missing
      const missingSections = [];
      Object.keys(sectionsToAdd).forEach(sectionName => {
        if (!content.includes(`## ${sectionName}`)) {
          missingSections.push(sectionName);
        }
      });
      
      if (missingSections.length > 0) {
        console.log(`Adding missing sections to ${filename}: ${missingSections.join(', ')}`);
        
        // Add missing sections before the last section (usually Implementation Notes or Files Created/Modified)
        missingSections.forEach(sectionName => {
          const sectionContent = sectionsToAdd[sectionName];
          
          // Find a good place to insert (before the last section)
          const sections = content.split('## ');
          if (sections.length > 1) {
            // Insert before the last section
            const lastSectionIndex = sections.length - 1;
            sections.splice(lastSectionIndex, 0, sectionContent + '\n\n## ');
            content = sections.join('## ');
          } else {
            // If no sections found, append at the end
            content += '\n\n' + sectionContent;
          }
        });
        
        fs.writeFileSync(filepath, content);
      }
    }
  });
  
  console.log('✅ Added missing sections to all task files.');
}

addMissingSections(); 