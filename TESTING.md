# Kroger Clipper - Testing Guide

This document describes the test suites for the Kroger Coupon Clipper extension and how to run them.

## Overview

The extension has two main test files:
- **[clipper.test.js](clipper.test.js)** - Tests for the content script
- **[popup.test.js](popup.test.js)** - Tests for the popup UI

These are **manual test suites** designed to be executed in a live browser environment since browser extension APIs cannot be easily mocked.

## Prerequisites

1. Extension loaded in Chrome or Firefox
2. Active Kroger account (logged in)
3. Access to https://www.kroger.com/savings/cl/coupons/
4. **Important**: Let the extension initialize categories (wait ~2 seconds after page load for category discovery)

## Running Content Script Tests (clipper.test.js)

### Setup

**IMPORTANT:** These tests need access to the content script's variables and functions. You have two options:

#### Option A: Load clipper.js first (Recommended)

1. Navigate to the Kroger coupons page: https://www.kroger.com/savings/cl/coupons/
2. Open Chrome/Firefox DevTools (F12 or right-click → Inspect)
3. Go to the Console tab
4. **First:** Copy the entire contents of [clipper.js](clipper.js) and paste into console
5. **Then:** Copy the entire contents of [clipper.test.js](clipper.test.js) and paste into console
6. Run tests using `runAllClipperTests()`

#### Option B: Temporarily add tests to clipper.js

1. Open [clipper.js](clipper.js) in your editor
2. Copy the contents of [clipper.test.js](clipper.test.js)
3. Paste at the end of clipper.js (after line 224)
4. Reload the extension
5. Navigate to Kroger coupons page
6. Open DevTools Console
7. Run `runAllClipperTests()`
8. **Remember to remove tests from clipper.js when done!**

### Run All Tests

```javascript
runAllClipperTests()
```

This will execute all automated tests. Note that some tests are skipped to avoid side effects (e.g., actually clipping 249 coupons).

### Run Individual Test Suites

**Category Filtering Tests:**
```javascript
test_shouldClipCoupon_filters_alcohol()         // Filters Adult Beverage category
test_shouldClipCoupon_filters_tobacco()         // Filters Tobacco category
test_shouldClipCoupon_allows_enabled_category() // Allows enabled categories (e.g., Produce)
test_shouldClipCoupon_any_enabled_allows()      // Clips if ANY category is enabled
test_shouldClipCoupon_allows_uncategorized()    // Allows coupons with no data-category
test_shouldClipCoupon_all_filters_disabled()    // Clips everything when all filters off
```

**Clipping Workflow Tests:**
```javascript
await test_clipAllCoupons_respects_stop_flag()
await test_clipAllCoupons_checks_storage_flag()
await test_clipAllCoupons_filters_buttons()
```

**Scroll Functionality Tests:**
```javascript
await test_scrollToLoadAllCoupons()
await test_scrollToLoadAllCoupons_stops_at_total()
```

**Full Workflow Tests:**
```javascript
test_runClippingWorkflow_reads_total()
```

### Manual Tests (Content Script)

Some tests require manual interaction:

**Message Handling:**
1. Run test function to set up listener
2. Open extension popup
3. Click "Start Clipping" or close popup to trigger messages
4. Verify in console that messages are received

## Running Popup Tests (popup.test.js)

### Setup

1. Click the Kroger Clipper extension icon to open the popup
2. Right-click anywhere in the popup window
3. Select "Inspect" or "Inspect Element"
4. A separate DevTools window will open for the popup
5. Go to the Console tab
6. Copy the entire contents of [popup.test.js](popup.test.js)
7. Paste into the console and press Enter

### Run All Tests

```javascript
runAllPopupTests()
```

This will execute all automated tests. Many tests require manual verification as noted in the console output.

### Run Individual Test Suites

**DOM and Initial State:**
```javascript
test_dom_elements_exist()
test_filter_checkboxes_exist()
test_initial_ui_state()
test_default_filter_states()
```

**Filter Toggle:**
```javascript
test_toggle_filters_button()
test_filter_checkboxes_toggleable()
```

**Storage:**
```javascript
await test_filter_preferences_saved()
await test_filter_preferences_loaded()
```

**Cross-browser Compatibility:**
```javascript
test_extension_api_wrapper()
await test_active_tab_query()
```

### Manual Tests (Popup)

Many popup tests require manual interaction. Follow the instructions printed in the console:

**Button Handlers:**
- Click "Start Clipping" and verify UI changes
- Click "Cancel" and verify popup closes
- Click "X" button and verify popup closes

**Message Handling:**
- Start clipping and watch progress updates
- Wait for completion and verify "All coupons clipped!" message
- Test limit-reached scenario (if you have 250+ coupons)

**Stop Functionality:**
- Start clipping, then click outside popup → verify clipping stops
- Start clipping, then click X button → verify clipping stops
- Open popup without clipping, close it → verify no stop messages

## Test Coverage

### clipper.test.js (Content Script)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Category Filtering | 6 | Data-attribute based filtering with dynamic categories |
| Message Handling | 3 | Start/stop messages update state and filters |
| Clipping Workflow | 6 | Buttons are filtered, clicked, marked, and counted correctly |
| Scroll Functionality | 2 | Page scrolls and loads all coupons |
| Full Workflow | 2 | Complete process from scroll to clip to done |

**Total: 19 test cases**

**Key Changes in Category Filtering Tests:**
- Now uses `data-category` attributes instead of text content
- Tests dynamic category system (Adult Beverage, Tobacco, Produce, etc.)
- Includes test for "clip everything when all filters disabled"
- Tests "any enabled category allows" logic

### popup.test.js (Popup Script)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| DOM Elements | 4 | All required elements exist with correct initial state |
| Filter Toggle | 2 | Filter section shows/hides correctly |
| Storage | 3 | Preferences are saved and loaded from storage |
| Button Handlers | 5 | Buttons trigger correct actions and UI updates |
| Message Handling | 3 | Messages from content script update UI correctly |
| Stop Functionality | 4 | Popup close events stop clipping process |
| Cross-browser | 2 | Extension API works in Chrome and Firefox |
| Edge Cases | 3 | Handles errors and edge cases gracefully |

**Total: 26 test cases**

## Test Results Format

Tests output results in the following format:

```
✓ PASS  - Test passed
✗ FAIL  - Test failed
⚠ SKIP  - Test skipped (usually to avoid side effects)
⚠ Manual test - Requires manual verification
```

## Common Issues

### "activeFilters is not defined" Error

**Issue:** `ReferenceError: activeFilters is not defined` when running clipper tests

**Solution:** The test file needs access to clipper.js variables. You must:
1. **First** paste the entire [clipper.js](clipper.js) into console
2. **Then** paste [clipper.test.js](clipper.test.js)
3. Run `runAllClipperTests()`

**Alternative:** Temporarily append the test code to the end of clipper.js and reload the extension.

### Tests Fail in Console

**Issue:** `extensionAPI is not defined` or similar errors

**Solution:** Make sure you're testing in the correct context:
- Content script tests must run on the Kroger coupons page console
- Popup tests must run in the popup's DevTools console (not the main page)

### Storage Tests Fail

**Issue:** Storage tests show incorrect values

**Solution:** Clear extension storage before testing:
```javascript
await extensionAPI.storage.local.clear()
await extensionAPI.storage.sync.clear()
```

### Can't Stop Clipping

**Issue:** Clipping continues even after closing popup

**Solution:** Manually set stop flag:
```javascript
await extensionAPI.storage.local.set({ clipperShouldStop: true })
```

### Too Many Coupons Clipped

**Issue:** Don't want to clip hundreds of coupons while testing

**Solution:** Individual test functions can be run in isolation. Tests that actually clip coupons are marked clearly and can be skipped.

### No Categories Found

**Issue:** Tests fail because `activeFilters` is empty or categories weren't discovered

**Solution:** Make sure you waited at least 2 seconds after page load for the extension to discover categories from Kroger's filter UI. Check the console for `[Kroger Clipper] Found categories:` message. If categories weren't found, refresh the page and wait longer.

## Continuous Testing

### After Code Changes

When modifying the extension, run these critical tests:

1. **After changing [clipper.js](clipper.js):**
   - `test_shouldClipCoupon_filters_alcohol()`
   - `test_shouldClipCoupon_any_enabled_allows()`
   - `await test_clipAllCoupons_respects_stop_flag()`
   - `await test_clipAllCoupons_checks_storage_flag()`

2. **After changing [popup.js](popup.js):**
   - `test_dom_elements_exist()`
   - `test_toggle_filters_button()`
   - `await test_filter_preferences_saved()`

3. **After changing filter logic or category discovery:**
   - Run all Category Filtering tests
   - Verify `activeFilters` in console contains discovered categories
   - Check popup shows all categories dynamically

4. **After changing stop mechanism:**
   - All Stop Functionality tests (manual)
   - `await test_clipAllCoupons_checks_storage_flag()`

### Full Regression Testing

Before releasing a new version:

1. Run `runAllClipperTests()` on Kroger coupons page
2. Run `runAllPopupTests()` in popup DevTools
3. Manually verify all "⚠ Manual test" instructions
4. Test in both Chrome and Firefox
5. Verify on a real Kroger account with actual coupons

## Writing New Tests

When adding new functionality:

1. Add test function to appropriate file
2. Follow naming convention: `test_<functionality>_<expected_behavior>`
3. Use `console.assert()` for assertions
4. Log `✓ PASS` or `✗ FAIL` at the end
5. Add to appropriate test suite in runner function
6. Document any manual steps required
7. Update this document with new test coverage

### Test Template

```javascript
/**
 * TEST X.Y: Description of what is being tested
 * Expected: What should happen
 */
function test_feature_name_behavior() {
  console.log("TEST X.Y: Feature name behavior");

  // Setup
  const element = document.getElementById("test");

  // Execute
  const result = someFunction();

  // Assert
  console.assert(result === expected, 'Expected message');
  console.log(result === expected ? '✓ PASS' : '✗ FAIL');
}
```

## Automated Testing (Future)

Currently, all tests are manual because:
- Extension APIs require browser environment
- DOM manipulation needs real popup/page context
- Message passing requires extension runtime

Potential improvements:
- Use a framework like Puppeteer for automated browser testing
- Mock extension APIs for unit testing
- Set up CI/CD with automated extension loading
- Add integration tests with test Kroger account

## Test Data

For consistent testing, you can use these mock data structures:

**Mock Coupon Card:**
```javascript
const mockCoupon = document.createElement('div');
mockCoupon.className = 'CouponCard';
mockCoupon.innerHTML = `
  <button class="CouponCard-button">Clip</button>
  <div class="CouponCard-content">Save $1 on Milk</div>
`;
```

**Mock Filter State:**
```javascript
const testFilters = {
  freeItems: true,
  freshProduce: true,
  meat: false,
  dairy: true,
  alcohol: false,
  tobacco: false
};
```

## Support

If you encounter issues with the test suites:

1. Check that the extension is loaded correctly
2. Verify you're on the correct page/context
3. Clear extension storage and reload
4. Check browser console for errors
5. Review test prerequisites above

For bugs or improvements to the test suites, please open an issue on GitHub.
