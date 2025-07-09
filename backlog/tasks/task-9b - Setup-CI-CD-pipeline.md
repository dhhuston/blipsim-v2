---
id: task-9b
title: 'Setup CI/CD pipeline'
status: To Do
assignee: []
created_date: '2025-07-08'
updated_date: '2025-07-08'
labels: ['github', 'ci-cd', 'automation']
dependencies: ['task-9a']
priority: high
---

## Description

Setup GitHub Actions CI/CD pipeline for automated testing, building, and deployment of the BLIiPSim v2 application.

## Acceptance Criteria
- [ ] Create GitHub Actions workflow for automated testing
- [ ] Setup automated build process for production
- [ ] Configure deployment to static hosting
- [ ] Setup automated dependency updates
- [ ] Configure code quality checks (ESLint, Prettier)
- [ ] Setup automated security scanning
- [ ] Configure branch-based deployment strategy
- [ ] Setup automated release process

## Technical Specifications

### GitHub Actions Workflow Structure
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly dependency updates

env:
  NODE_VERSION: '18'
  NPM_VERSION: '9'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: app/package-lock.json
      
      - name: Install dependencies
        run: |
          cd app
          npm ci
      
      - name: Run linting
        run: |
          cd app
          npm run lint
      
      - name: Run tests
        run: |
          cd app
          npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: app/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: app/package-lock.json
      
      - name: Install dependencies
        run: |
          cd app
          npm ci
      
      - name: Build application
        run: |
          cd app
          npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: app/dist/
          retention-days: 30

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: app/dist/
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './app/dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  dependency-updates:
    name: Dependency Updates
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: |
          cd app
          npm ci
      
      - name: Check for outdated dependencies
        run: |
          cd app
          npm outdated
      
      - name: Create Pull Request for updates
        uses: peter-evans/create-pull-request@v4
        with:
          title: 'chore: update dependencies'
          body: |
            Automated dependency updates
            
            This PR updates outdated dependencies to their latest versions.
            
            - [ ] Test locally
            - [ ] Review changes
            - [ ] Merge if tests pass
          branch: dependency-updates
          delete-branch: true
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,js,jsx,json,css,md}",
    "format:check": "prettier --check src/**/*.{ts,tsx,js,jsx,json,css,md}",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:prettier/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'jest-transform-stub',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000
};
```

### Husky Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### Commitlint Configuration
```javascript
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'build'
      ]
    ]
  }
};
```

## Implementation Notes
- Setup GitHub Actions for automated testing and deployment
- Configure ESLint and Prettier for code quality
- Setup Jest for comprehensive testing
- Configure Husky for pre-commit hooks
- Setup automated dependency updates
- Configure security scanning with Snyk and CodeQL
- Setup deployment to Netlify or similar static hosting
- Configure branch-based deployment strategy

## Files Created/Modified
- `.github/workflows/ci.yml` - Main CI/CD workflow
- `.github/workflows/dependency-updates.yml` - Automated dependency updates
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `jest.config.js` - Jest configuration
- `.husky/pre-commit` - Pre-commit hook
- `.commitlintrc.js` - Commit message linting
- `app/package.json` - Updated scripts for CI/CD

## Verification Steps
1. Push changes to trigger GitHub Actions workflow
2. Verify all tests pass in CI environment
3. Check that build process completes successfully
4. Verify deployment to staging/production environments
5. Test automated dependency updates
6. Verify security scans run without critical issues
7. Check that pre-commit hooks work locally
8. Verify code quality checks pass in CI 