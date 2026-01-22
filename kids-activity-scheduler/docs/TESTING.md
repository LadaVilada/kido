# Testing Guide

## Overview

The Kids Activity Scheduler uses **Vitest** as the testing framework with **React Testing Library** for component testing. The test suite covers unit tests, integration tests, and component tests to ensure reliability and maintainability.

## Test Stack

- **Test Runner**: Vitest 4.0+
- **Component Testing**: React Testing Library 16.3+
- **DOM Environment**: jsdom 27.4+
- **Mocking**: Vitest built-in mocking

## Running Tests

### Run All Tests (Single Run)
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test File
```bash
npm test -- src/lib/__tests__/calendarLayout.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Structure

### Test Organization

```
src/
├── components/
│   └── __tests__/           # Component tests
│       ├── ActivityBlock.test.tsx
│       ├── DayView.test.tsx
│       └── WeekView.test.tsx
├── contexts/
│   └── __tests__/           # Context tests
│       └── AuthContext.test.tsx
├── hooks/
│   └── __tests__/           # Hook tests
│       ├── useCalendar.test.ts
│       └── usePWA.test.ts
├── lib/
│   └── __tests__/           # Utility tests
│       ├── calendarLayout.test.ts
│       ├── activityOccurrences.test.ts
│       ├── auth.test.ts
│       ├── offlineSync.test.ts
│       ├── pwa.test.ts
│       ├── performance.test.ts
│       ├── pwaInstallation.test.ts
│       └── setup.ts         # Test setup and configuration
└── services/
    └── __tests__/           # Service tests
        ├── activitiesService.test.ts
        └── childrenService.test.ts
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/lib/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup (`src/lib/__tests__/setup.ts`)

The setup file configures:
- Custom DOM matchers (e.g., `toBeInTheDocument`)
- Automatic cleanup after each test
- Mock environment variables for Firebase
- Mock browser APIs (Service Worker, Cache Storage, matchMedia)
- Mock Performance Timing API

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and utilities in isolation.

**Examples**:
- `calendarLayout.test.ts` - Overlap detection and layout calculations
- `activityOccurrences.test.ts` - Activity occurrence generation
- `auth.test.ts` - Authentication utilities

**Pattern**:
```typescript
describe('functionName', () => {
  it('should do something specific', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
```

### 2. Component Tests

**Purpose**: Test React components with user interactions.

**Examples**:
- `ActivityBlock.test.tsx` - Activity block rendering and interactions
- `DayView.test.tsx` - Day calendar view
- `WeekView.test.tsx` - Week calendar view

**Pattern**:
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 3. Hook Tests

**Purpose**: Test custom React hooks.

**Examples**:
- `useCalendar.test.ts` - Calendar state management
- `usePWA.test.ts` - PWA installation detection

**Pattern**:
```typescript
describe('useHookName', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe(expected);
  });

  it('should update on action', () => {
    const { result } = renderHook(() => useHookName());
    
    act(() => {
      result.current.action();
    });
    
    expect(result.current.value).toBe(newExpected);
  });
});
```

### 4. Service Tests

**Purpose**: Test Firebase service layer with mocked Firestore.

**Examples**:
- `activitiesService.test.ts` - Activity CRUD operations
- `childrenService.test.ts` - Child profile management

**Pattern**:
```typescript
vi.mock('@/lib/firestore', () => ({
  createDocument: vi.fn(),
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

describe('ServiceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create document', async () => {
    vi.mocked(createDocument).mockResolvedValue('doc-id');
    
    const result = await ServiceName.create(data);
    
    expect(createDocument).toHaveBeenCalledWith('collection', data);
    expect(result).toBe('doc-id');
  });
});
```

### 5. Integration Tests

**Purpose**: Test multiple components/services working together.

**Examples**:
- Calendar overlap display with multiple activities
- Authentication flow with context and services

**Pattern**:
```typescript
describe('Feature Integration', () => {
  it('should work end-to-end', async () => {
    // Setup
    const { result } = renderHook(() => useFeature());
    
    // Action
    await act(async () => {
      await result.current.performAction();
    });
    
    // Verify
    expect(result.current.state).toBe(expectedState);
  });
});
```

## Test Coverage

### Current Coverage Areas

✅ **Calendar Layout System**
- Overlap detection algorithm
- Column assignment
- Width and position calculations
- Overflow handling
- Edge cases (identical times, partial overlaps)

✅ **Activity Management**
- Activity occurrence generation
- Time validation
- Recurrence patterns
- Conflict detection

✅ **Calendar Views**
- Week view rendering
- Day view rendering
- Activity positioning
- Overlap display
- Mobile responsiveness

✅ **PWA Features**
- Installation detection
- Service worker registration
- Cache management
- Offline sync
- Performance monitoring

✅ **Authentication**
- User authentication flow
- Session management
- Error handling
- Password reset

✅ **Services**
- Activities CRUD
- Children CRUD
- Validation
- Error handling

### Coverage Goals

- **Unit Tests**: > 80% coverage
- **Component Tests**: > 70% coverage
- **Integration Tests**: Critical paths covered

## Writing Tests

### Best Practices

1. **Descriptive Test Names**
   ```typescript
   // Good
   it('should calculate 50% width for 2 overlapping activities', () => {});
   
   // Bad
   it('should work', () => {});
   ```

2. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = createTestData();
     
     // Act
     const result = functionUnderTest(input);
     
     // Assert
     expect(result).toBe(expected);
   });
   ```

3. **Test One Thing**
   ```typescript
   // Good - tests one behavior
   it('should return true for valid email', () => {
     expect(isValidEmail('test@example.com')).toBe(true);
   });
   
   // Bad - tests multiple behaviors
   it('should validate email and password', () => {
     expect(isValidEmail('test@example.com')).toBe(true);
     expect(isValidPassword('password123')).toBe(true);
   });
   ```

4. **Use Test Helpers**
   ```typescript
   // Create reusable test data factories
   function createActivity(overrides = {}) {
     return {
       id: '1',
       title: 'Test Activity',
       startTime: '09:00',
       endTime: '10:00',
       ...overrides,
     };
   }
   ```

5. **Mock External Dependencies**
   ```typescript
   vi.mock('@/lib/firebase', () => ({
     auth: {},
     db: {},
   }));
   ```

6. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
     cleanup();
   });
   ```

### Common Patterns

#### Testing Async Functions
```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

#### Testing Error Handling
```typescript
it('should throw error for invalid input', () => {
  expect(() => functionWithValidation(invalidInput)).toThrow('Error message');
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

#### Testing React Components
```typescript
it('should render with props', () => {
  render(<Component title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});

it('should handle click events', () => {
  const onClick = vi.fn();
  render(<Component onClick={onClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledTimes(1);
});
```

#### Testing Hooks
```typescript
it('should update state', () => {
  const { result } = renderHook(() => useCustomHook());
  
  act(() => {
    result.current.updateValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

## Mocking

### Mocking Modules
```typescript
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));
```

### Mocking Functions
```typescript
const mockFunction = vi.fn();
mockFunction.mockReturnValue('mocked value');
mockFunction.mockResolvedValue('async value');
mockFunction.mockRejectedValue(new Error('error'));
```

### Mocking Timers
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should work with timers', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);
  
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

### Mocking Browser APIs
```typescript
// Already mocked in setup.ts:
// - window.matchMedia
// - navigator.serviceWorker
// - caches
// - performance.timing

// Additional mocking in tests:
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});
```

## Debugging Tests

### Run Single Test
```bash
npm test -- -t "test name pattern"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Test Output
```bash
npm test -- --reporter=verbose
```

### Check Coverage
```bash
npm test -- --coverage --reporter=html
```
Then open `coverage/index.html` in a browser.

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Pre-deployment checks

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

## Known Issues

### Issue: `toBeInTheDocument` Type Error

**Problem**: TypeScript shows error for `toBeInTheDocument` matcher in component tests.

**Root Cause**: Vitest doesn't include DOM-specific matchers by default like Jest does.

**Solution**: 
1. Custom matcher is defined in `src/lib/__tests__/setup.ts`
2. TypeScript types are declared in `src/lib/__tests__/vitest.d.ts`

**Status**: ✅ Fixed - Tests run successfully and TypeScript errors are resolved.

**Implementation**:
```typescript
// src/lib/__tests__/setup.ts
expect.extend({
  toBeInTheDocument(received: HTMLElement | null) {
    const pass = received !== null && document.body.contains(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to be in the document`
          : `expected element to be in the document`,
    };
  },
});

// src/lib/__tests__/vitest.d.ts
interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
}
```

### Issue: Unused Variables in Tests

**Problem**: Some test variables are declared but not used (e.g., `waitFor`, `container`).

**Solution**: These are intentional for future use or documentation purposes. Can be safely ignored or removed.

**Status**: ⚠️ Minor - Does not affect test execution.

## Future Improvements

- [ ] Add visual regression testing with Playwright
- [ ] Add E2E tests for critical user flows
- [ ] Increase test coverage to 90%+
- [ ] Add performance benchmarking tests
- [ ] Add accessibility testing with axe-core
- [ ] Add mutation testing with Stryker

## Related Documentation

- [PWA Testing Guide](./PWA_TESTING_GUIDE.md)
- [E2E Integration Test](./E2E_INTEGRATION_TEST.md)
- [Calendar Overlap Display](./CALENDAR_OVERLAP_DISPLAY.md)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
