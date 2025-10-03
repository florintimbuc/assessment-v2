# Solution Docs

## Backend

### 1. Refactoring blocking I/O

- Replaced synchronous fs operations with `fs.promises` API
- Added proper error handling for file operations

**Trade-offs**:

- **Pros**: Server can handle concurrent requests efficiently, better scalability and the async/await syntax is more readable

**Edge Cases handled**:

- Missing or corrupted data file & file system errors

---

### 2. Performance, Stats caching

- Implemented in-memory cache for calculated statistics
- Used `fs.watch()` to automatically invalidate cache when data file changes

**Trade-offs**:

- **Pros**: Automatic cache invalidation keeps data fresh and we'll have a significant performance improvement for repeated requests
- **Cons**: Uses server memory (minimal for single stats object), but Redis or similar should be considered in production
- **Cons**: `fs.watch()` behavior can vary across file systems

**Edge Cases handled**:

- File watcher errors and missing, invalid or non-array data file

---

### 3. Pagination & Search

- Implemented standard pagination with `page` and `pageSize` query parameters
- Maintained backward compatibility with legacy `limit` parameter and combined pagination with existing search functionality

**Trade-offs**:

- **Pros**: Reduces network payload for large datasets
- **Cons**: In production I would consider cursor-based pagination for very large datasets

---

**Test Coverage**:

- GET /api/items - pagination, search, filtering, edge cases
- GET /api/items/:id - success, 404, invalid IDs
- POST /api/items - validation, success, error cases
- Edge cases: NaN, negative values, zero, overflow, empty results

---

## Frontend

### 1. Memory Leak Fix

- Modified `Items.js` to create AbortController and abort fetch on unmount
- Added proper error handling for AbortError

**Trade-offs**:

- **Pros**: Prevents state updates after component unmount, eliminating memory leaks and cancels pending network requests

---

### 2. Pagination & Search UI

- Added search input with 300ms debouncing to reduce API calls
- Display pagination info

**Trade-offs**:

- **Pros**: Debouncing prevents excessive API calls during typing
- **Pros**: User-friendly interface for navigating large datasets

---

### 3. Virtualization (react-window)

- Only renders visible items in viewport

**Trade-offs**:

- **Pros**: Handles thousands of items without performance degradation with smooth scrolling
- **Cons**: Slightly more complex DOM structure

---

### 4. UI/UX Polish

- Animated spinner and loading indicator during data fetches
- Disabled inputs/buttons while loading
- Error handling
- Added Tailwindcss styling
