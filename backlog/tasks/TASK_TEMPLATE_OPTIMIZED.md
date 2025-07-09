# Optimized Task Template for AI Code Creation

## Template Structure

```markdown
---
id: task-{category}-{subtask}
title: 'Specific focused task description'
status: To Do
assignee: []
created_date: 'YYYY-MM-DD'
updated_date: 'YYYY-MM-DD'
labels: ['category', 'subcategory', 'priority']
dependencies:
  - task-{dependency1}
  - task-{dependency2}
priority: high|medium|low
---

## Description

Clear, focused description of what this task accomplishes in 1-2 sentences.

## Technical Specifications

### Data Models
```typescript
interface {ComponentName}Props {
  // Define exact TypeScript interfaces
  // Include all required and optional properties
  // Add JSDoc comments for complex types
}

interface {ServiceName}Config {
  // Configuration interfaces
  // Default values and constraints
}

interface {ResultType} {
  // Result/response interfaces
  // Include all expected properties
}
```

### File Structure
```
{category}/
├── {componentName}.tsx        # Main component/service
├── {componentName}.test.tsx   # Unit tests
├── {componentName}.css        # Styles (if applicable)
└── types/
    └── {componentName}.ts     # Type definitions
```

### Integration Points
- Connect to `{existingFile}.tsx` for {specific purpose}
- Integrate with `{existingService}.ts` for {data flow}
- Update `{mainFile}.tsx` to include {new feature}
- Connect to `{externalAPI}` for {external data}

## Acceptance Criteria
- [ ] Specific, testable criteria with clear success metrics
- [ ] Each item is independently verifiable
- [ ] Clear definition of completion
- [ ] Performance benchmarks included
- [ ] Error scenarios covered

## Testing Requirements
- Unit tests for each {function/component} method
- Integration tests with mock {data/API} responses
- Performance tests for {large datasets/concurrent requests}
- Error handling tests for {specific failure modes}
- Edge case testing ({extreme values/missing data})
- End-to-end tests with real {APIs/user interactions}

## Performance Requirements
- {Operation} time < {X}ms for typical {scenarios}
- Memory usage < {X}MB for {large datasets}
- {API} calls limited to {X} per {time period}
- Bundle size increase < {X}KB ({dependencies})
- {UI} interactions maintain {X}fps

## Error Handling
- Graceful degradation when {service} unavailable
- Retry logic for {transient failures} ({X} attempts)
- Timeout protection for {slow operations} ({X}s)
- Validation for {input types} with clear error messages
- Fallback behavior for {missing data scenarios}

## Browser Compatibility
- Chrome {version}+
- Firefox {version}+
- Safari {version}+
- Edge {version}+
- Mobile browsers: iOS Safari {version}+, Chrome Mobile {version}+

## Security Considerations
- Input validation for {user inputs}
- Sanitization of {external data}
- Rate limiting for {API calls}
- CORS handling for {cross-origin requests}

## Implementation Notes
- Implement in `{file path}` using {technology/framework}
- Follow {design pattern/architecture} for consistency
- Use {state management} for {data flow}
- Include {accessibility features} for {user types}
- Support {responsive design} for {device types}

## Files Created/Modified
- `{file path}` - {purpose and key features}
- `{file path}` - {test coverage and scenarios}
- `{file path}` - {styling and theming}
- `{file path}` - {integration and updates}

## Dependencies
### Required Packages
```json
{
  "{packageName}": "^{version}",
  "{packageName}": "^{version}"
}
```

### Development Dependencies
```json
{
  "@types/{packageName}": "^{version}",
  "{testingPackage}": "^{version}"
}
```

## API Integration (if applicable)
### Endpoint
- **URL**: `{baseUrl}/{endpoint}`
- **Method**: {GET|POST|PUT|DELETE}
- **Authentication**: {None|Bearer|API Key}
- **Rate Limit**: {X} requests per {time period}

### Request Format
```typescript
interface {API}Request {
  // Request parameters
}
```

### Response Format
```typescript
interface {API}Response {
  // Response structure
}
```

## Accessibility Requirements
- ARIA labels for {interactive elements}
- Keyboard navigation support for {components}
- Screen reader compatibility for {content}
- Color contrast ratios meeting WCAG {level}
- Focus management for {dynamic content}

## Mobile Considerations
- Touch-friendly {interactions} ({X}px minimum)
- Responsive breakpoints for {screen sizes}
- Performance optimization for {mobile devices}
- Offline capability for {critical features}

## Documentation Requirements
- JSDoc comments for {public methods}
- README updates for {new features}
- API documentation for {external interfaces}
- User guide updates for {UI changes}

## Deployment Considerations
- Environment variables for {configurable values}
- Build optimization for {production}
- CDN integration for {static assets}
- Monitoring setup for {performance metrics}
```

## Usage Guidelines

### For AI Code Creation
1. **Copy this template** for each new task
2. **Fill in all sections** with specific details
3. **Include exact file paths** and TypeScript interfaces
4. **Specify performance constraints** and error scenarios
5. **Define clear acceptance criteria** with checkboxes
6. **List all dependencies** and integration points

### For Task Review
1. **Verify technical specifications** are complete
2. **Check acceptance criteria** are testable
3. **Ensure performance requirements** are realistic
4. **Validate error handling** covers edge cases
5. **Confirm integration points** are accurate

### For Implementation
1. **Follow the file structure** exactly
2. **Implement all TypeScript interfaces** as specified
3. **Write tests for all acceptance criteria**
4. **Meet performance requirements** in testing
5. **Handle all error scenarios** listed
6. **Update documentation** as specified

## Example Usage

### Simple Component Task
```markdown
---
id: task-15a
title: 'Create user profile component'
status: To Do
labels: ['ui', 'component', 'user']
dependencies:
  - task-10d
priority: medium
---

## Description
Create a user profile component that displays user information and allows editing.

## Technical Specifications
### Data Models
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

interface UserProfileProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  isEditing: boolean;
}
```

### File Structure
```
components/
├── UserProfile.tsx
├── UserProfile.test.tsx
└── UserProfile.css
```

## Acceptance Criteria
- [ ] Display user information in read-only mode
- [ ] Allow editing of user details
- [ ] Validate email format
- [ ] Handle avatar upload
- [ ] Test all user interactions
```

### Complex Service Task
```markdown
---
id: task-20b
title: 'Implement real-time notification service'
status: To Do
labels: ['service', 'websocket', 'real-time']
dependencies:
  - task-15a
priority: high
---

## Description
Create a WebSocket-based notification service for real-time updates.

## Technical Specifications
### Data Models
```typescript
interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  userId: string;
}

interface NotificationServiceConfig {
  wsUrl: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
}
```

### Performance Requirements
- WebSocket connection < 500ms
- Message delivery < 100ms
- Memory usage < 20MB for 1000 notifications
- Reconnection attempts: 5 with exponential backoff
```

This template ensures consistent, comprehensive task definitions that optimize AI code creation with fewer errors and smaller context windows. 