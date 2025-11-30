/**
 * Test Suite for popup.js
 *
 * This file contains test cases for the Kroger Coupon Clipper popup script.
 * These are manual test cases to be executed in the browser's extension popup.
 *
 * To run these tests:
 * 1. Load the extension in Chrome/Firefox
 * 2. Click the extension icon to open popup
 * 3. Right-click popup and select "Inspect" to open DevTools
 * 4. Copy and paste test functions into console
 * 5. Execute tests one by one
 */

// =============================================================================
// TEST SUITE 1: DOM Elements and Initial State
// =============================================================================

/**
 * TEST 1.1: All required DOM elements exist
 * Expected: All buttons and elements are present in the DOM
 */
function test_dom_elements_exist() {
  console.log("TEST 1.1: Required DOM elements exist");

  const elements = {
    yesBtn: document.getElementById("yes"),
    noBtn: document.getElementById("no"),
    progress: document.getElementById("progress"),
    toggleFiltersBtn: document.getElementById("toggleFilters"),
    filtersSection: document.querySelector(".filters-section"),
    closeBtn: document.getElementById("closeBtn")
  };

  const allExist = Object.values(elements).every(el => el !== null);

  console.assert(allExist, 'Expected all DOM elements to exist');
  console.log(allExist ? '✓ PASS' : '✗ FAIL');

  if (!allExist) {
    Object.entries(elements).forEach(([name, el]) => {
      if (!el) console.log(`  ✗ Missing: ${name}`);
    });
  }
}

/**
 * TEST 1.2: Filter checkboxes exist for all categories
 * Expected: Checkboxes for all 15 filter categories are present
 */
function test_filter_checkboxes_exist() {
  console.log("TEST 1.2: Filter checkboxes exist");

  const expectedCategories = [
    'freeItems', 'freshProduce', 'meat', 'dairy', 'bakery',
    'pantryStaples', 'frozenFoods', 'snacks', 'beverages',
    'healthBeauty', 'household', 'baby', 'pet', 'alcohol', 'tobacco'
  ];

  const missingCategories = [];

  expectedCategories.forEach(category => {
    const checkbox = document.getElementById(category);
    if (!checkbox) {
      missingCategories.push(category);
    }
  });

  console.assert(missingCategories.length === 0, 'Expected all checkboxes to exist');
  console.log(missingCategories.length === 0 ? '✓ PASS' : '✗ FAIL');

  if (missingCategories.length > 0) {
    console.log(`  ✗ Missing: ${missingCategories.join(', ')}`);
  }
}

/**
 * TEST 1.3: Initial state of buttons and progress
 * Expected: Yes/No buttons visible, progress hidden initially
 */
function test_initial_ui_state() {
  console.log("TEST 1.3: Initial UI state is correct");

  const yesBtn = document.getElementById("yes");
  const noBtn = document.getElementById("no");
  const progress = document.getElementById("progress");
  const filtersSection = document.querySelector(".filters-section");

  const yesBtnVisible = window.getComputedStyle(yesBtn).display !== 'none';
  const noBtnVisible = window.getComputedStyle(noBtn).display !== 'none';
  const progressHidden = window.getComputedStyle(progress).display === 'none';
  const filtersHidden = window.getComputedStyle(filtersSection).display === 'none';

  console.assert(yesBtnVisible, 'Expected Yes button to be visible');
  console.assert(noBtnVisible, 'Expected No button to be visible');
  console.assert(progressHidden, 'Expected progress to be hidden');
  console.assert(filtersHidden, 'Expected filters to be hidden initially');

  const passed = yesBtnVisible && noBtnVisible && progressHidden && filtersHidden;
  console.log(passed ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.4: Default filter states
 * Expected: Most filters checked by default, alcohol and tobacco unchecked
 */
function test_default_filter_states() {
  console.log("TEST 1.4: Default filter states are correct");

  const shouldBeChecked = [
    'freeItems', 'freshProduce', 'meat', 'dairy', 'bakery',
    'pantryStaples', 'frozenFoods', 'snacks', 'beverages',
    'healthBeauty', 'household', 'baby', 'pet'
  ];

  const shouldBeUnchecked = ['alcohol', 'tobacco'];

  let allCorrect = true;

  shouldBeChecked.forEach(category => {
    const checkbox = document.getElementById(category);
    if (checkbox && !checkbox.checked) {
      console.log(`  ✗ ${category} should be checked but isn't`);
      allCorrect = false;
    }
  });

  shouldBeUnchecked.forEach(category => {
    const checkbox = document.getElementById(category);
    if (checkbox && checkbox.checked) {
      console.log(`  ✗ ${category} should be unchecked but is checked`);
      allCorrect = false;
    }
  });

  console.assert(allCorrect, 'Expected correct default filter states');
  console.log(allCorrect ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST SUITE 2: Filter Toggle Functionality
// =============================================================================

/**
 * TEST 2.1: Toggle filters button shows/hides filters
 * Expected: Clicking button toggles filter section visibility
 */
function test_toggle_filters_button() {
  console.log("TEST 2.1: Toggle filters button works");

  const toggleBtn = document.getElementById("toggleFilters");
  const filtersSection = document.querySelector(".filters-section");

  // Initial state should be hidden
  const initiallyHidden = window.getComputedStyle(filtersSection).display === 'none';

  // Click to show
  toggleBtn.click();
  const nowVisible = window.getComputedStyle(filtersSection).display === 'block';
  const buttonTextShow = toggleBtn.textContent === 'Hide Filters';

  // Click to hide
  toggleBtn.click();
  const hiddenAgain = window.getComputedStyle(filtersSection).display === 'none';
  const buttonTextHide = toggleBtn.textContent === 'Show Filters';

  console.assert(initiallyHidden, 'Expected filters to be hidden initially');
  console.assert(nowVisible, 'Expected filters to be visible after first click');
  console.assert(buttonTextShow, 'Expected button text to say "Hide Filters"');
  console.assert(hiddenAgain, 'Expected filters to be hidden after second click');
  console.assert(buttonTextHide, 'Expected button text to say "Show Filters"');

  const passed = initiallyHidden && nowVisible && buttonTextShow && hiddenAgain && buttonTextHide;
  console.log(passed ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 2.2: Filter checkboxes are toggleable
 * Expected: Checkboxes can be checked and unchecked
 */
function test_filter_checkboxes_toggleable() {
  console.log("TEST 2.2: Filter checkboxes are toggleable");

  const checkbox = document.getElementById("meat");

  if (!checkbox) {
    console.log("⚠ SKIP: Checkbox not found");
    return;
  }

  const initialState = checkbox.checked;

  // Toggle checkbox
  checkbox.click();
  const newState = checkbox.checked;

  // Toggle back
  checkbox.click();
  const finalState = checkbox.checked;

  console.assert(newState !== initialState, 'Expected state to change after click');
  console.assert(finalState === initialState, 'Expected state to return to original');

  const passed = (newState !== initialState) && (finalState === initialState);
  console.log(passed ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST SUITE 3: Storage Functionality
// =============================================================================

/**
 * TEST 3.1: Filter preferences are saved to storage
 * Expected: Changing checkbox saves to extensionAPI.storage.sync
 */
async function test_filter_preferences_saved() {
  console.log("TEST 3.1: Filter preferences are saved");

  const checkbox = document.getElementById("meat");

  if (!checkbox) {
    console.log("⚠ SKIP: Checkbox not found");
    return;
  }

  // Change checkbox state
  const newState = !checkbox.checked;
  checkbox.checked = newState;
  checkbox.dispatchEvent(new Event('change'));

  // Wait for storage to update
  await new Promise(r => setTimeout(r, 100));

  // Check storage
  const result = await extensionAPI.storage.sync.get('couponFilters');
  const savedState = result && result.couponFilters && result.couponFilters.meat;

  console.assert(savedState === newState, 'Expected saved state to match checkbox state');
  console.log(savedState === newState ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 3.2: Filter preferences are loaded from storage
 * Expected: Saved preferences are loaded on popup open
 */
async function test_filter_preferences_loaded() {
  console.log("TEST 3.2: Filter preferences are loaded from storage");

  // Set a custom filter state in storage
  const testFilters = {
    meat: false,
    dairy: true,
    alcohol: true
  };

  await extensionAPI.storage.sync.set({ couponFilters: testFilters });

  // Reload the popup to test loading (manual step)
  console.log("⚠ Manual test: Close and reopen popup to verify filters loaded");
  console.log("  Expected: meat=unchecked, dairy=checked, alcohol=checked");
}

/**
 * TEST 3.3: Stop flag is set in storage when popup closes
 * Expected: clipperShouldStop is set to true in local storage
 */
async function test_stop_flag_set_on_close() {
  console.log("TEST 3.3: Stop flag set in storage on close");

  // This requires simulating clipping state
  // Since we can't easily test popup close, we'll test the stopClipping function directly

  console.log("⚠ Manual test: Start clipping, then close popup");
  console.log("  Then check storage:");
  console.log("  extensionAPI.storage.local.get('clipperShouldStop')");
  console.log("  Expected: { clipperShouldStop: true }");
}

// =============================================================================
// TEST SUITE 4: Button Click Handlers
// =============================================================================

/**
 * TEST 4.1: Cancel button closes popup
 * Expected: Clicking No/Cancel closes the popup window
 */
function test_cancel_button_closes_popup() {
  console.log("TEST 4.1: Cancel button closes popup");

  const noBtn = document.getElementById("no");

  console.log("⚠ Manual test: Click the Cancel button");
  console.log("  Expected: Popup closes immediately");

  // Note: We can't programmatically test window.close() as it requires user gesture
}

/**
 * TEST 4.2: Close X button closes popup
 * Expected: Clicking X button closes the popup window
 */
function test_close_button_closes_popup() {
  console.log("TEST 4.2: Close X button closes popup");

  const closeBtn = document.getElementById("closeBtn");

  console.log("⚠ Manual test: Click the X button");
  console.log("  Expected: Popup closes immediately");
}

/**
 * TEST 4.3: Start Clipping button updates UI
 * Expected: Hides buttons, shows progress, updates text
 */
function test_start_clipping_updates_ui() {
  console.log("TEST 4.3: Start Clipping button updates UI");

  const yesBtn = document.getElementById("yes");
  const noBtn = document.getElementById("no");
  const progress = document.getElementById("progress");
  const toggleFiltersBtn = document.getElementById("toggleFilters");
  const filtersSection = document.querySelector(".filters-section");

  // Note: This will actually start clipping on the Kroger page
  console.log("⚠ Manual test: Click 'Start Clipping' button");
  console.log("  Expected:");
  console.log("    - Yes/No buttons hidden");
  console.log("    - Toggle Filters button hidden");
  console.log("    - Filters section hidden");
  console.log("    - Progress element visible");
  console.log("    - Progress text: 'Clipping in progress...'");
}

/**
 * TEST 4.4: Start Clipping sends message to content script
 * Expected: Message with type "start-clipping" is sent
 */
function test_start_clipping_sends_message() {
  console.log("TEST 4.4: Start Clipping sends message");

  console.log("⚠ Manual test:");
  console.log("  1. Open Kroger coupons page");
  console.log("  2. Open DevTools console on that page");
  console.log("  3. Add listener: extensionAPI.runtime.onMessage.addListener(msg => console.log('Received:', msg))");
  console.log("  4. Click 'Start Clipping' in popup");
  console.log("  Expected: Message logged with type 'start-clipping' and filters object");
}

/**
 * TEST 4.5: Start Clipping collects filter settings
 * Expected: Current checkbox states are sent in message
 */
function test_start_clipping_collects_filters() {
  console.log("TEST 4.5: Start Clipping collects filter settings");

  // Change some checkbox states
  const meatCheckbox = document.getElementById("meat");
  const alcoholCheckbox = document.getElementById("alcohol");

  if (meatCheckbox) meatCheckbox.checked = false;
  if (alcoholCheckbox) alcoholCheckbox.checked = true;

  console.log("⚠ Manual test:");
  console.log("  1. Changed meat to unchecked, alcohol to checked");
  console.log("  2. Click 'Start Clipping'");
  console.log("  3. Check console message on content page");
  console.log("  Expected: filters.meat === false, filters.alcohol === true");
}

// =============================================================================
// TEST SUITE 5: Message Handling
// =============================================================================

/**
 * TEST 5.1: Progress message updates UI
 * Expected: Progress text updates with clipped/total counts
 */
function test_progress_message_updates_ui() {
  console.log("TEST 5.1: Progress message updates UI");

  const progress = document.getElementById("progress");

  // Simulate receiving a progress message
  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      const expectedText = `Clipping... ${msg.clipped} / ${msg.total}`;
      console.assert(progress.textContent === expectedText, 'Expected progress text to match');
      console.log(progress.textContent === expectedText ? '✓ PASS' : '✗ FAIL');
    }
  });

  console.log("⚠ Manual test: Start clipping and watch progress updates");
}

/**
 * TEST 5.2: Done message updates UI and sets isClipping to false
 * Expected: Progress shows "All coupons clipped!" and isClipping becomes false
 */
function test_done_message_updates_ui() {
  console.log("TEST 5.2: Done message updates UI");

  const progress = document.getElementById("progress");

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "done") {
      console.assert(progress.textContent === "All coupons clipped!", 'Expected completion message');
      console.log(progress.textContent === "All coupons clipped!" ? '✓ PASS' : '✗ FAIL');
    }
  });

  console.log("⚠ Manual test: Wait for clipping to complete");
}

/**
 * TEST 5.3: Limit-reached message updates UI
 * Expected: Progress shows "250 coupon limit reached."
 */
function test_limit_reached_message_updates_ui() {
  console.log("TEST 5.3: Limit-reached message updates UI");

  const progress = document.getElementById("progress");

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "limit-reached") {
      console.assert(progress.textContent === "250 coupon limit reached.", 'Expected limit message');
      console.log(progress.textContent === "250 coupon limit reached." ? '✓ PASS' : '✗ FAIL');
    }
  });

  console.log("⚠ Manual test: Trigger 250 limit to see message");
}

// =============================================================================
// TEST SUITE 6: Stop Functionality
// =============================================================================

/**
 * TEST 6.1: visibilitychange event triggers stopClipping
 * Expected: When popup becomes hidden, stop message is sent
 */
function test_visibilitychange_triggers_stop() {
  console.log("TEST 6.1: visibilitychange triggers stop");

  console.log("⚠ Manual test:");
  console.log("  1. Start clipping");
  console.log("  2. Click outside popup to hide it");
  console.log("  3. Check content script console");
  console.log("  Expected: 'Clipping stopped by storage flag' or 'Stopping clipping process...'");
}

/**
 * TEST 6.2: pagehide event triggers stopClipping
 * Expected: When popup closes, stop message is sent
 */
function test_pagehide_triggers_stop() {
  console.log("TEST 6.2: pagehide triggers stop");

  console.log("⚠ Manual test:");
  console.log("  1. Start clipping");
  console.log("  2. Close popup with X button");
  console.log("  3. Check content script console");
  console.log("  Expected: 'Clipping stopped by storage flag' or 'Stopping clipping process...'");
}

/**
 * TEST 6.3: Storage flag is cleared when starting clipping
 * Expected: clipperShouldStop is set to false when Start Clipping is clicked
 */
async function test_storage_flag_cleared_on_start() {
  console.log("TEST 6.3: Storage flag cleared on start");

  // Set stop flag to true
  await extensionAPI.storage.local.set({ clipperShouldStop: true });

  console.log("⚠ Manual test:");
  console.log("  1. Stop flag set to true");
  console.log("  2. Click 'Start Clipping'");
  console.log("  3. Check: extensionAPI.storage.local.get('clipperShouldStop')");
  console.log("  Expected: { clipperShouldStop: false }");
}

/**
 * TEST 6.4: Stop message is sent when isClipping is true
 * Expected: stopClipping only sends message if actively clipping
 */
function test_stop_only_when_clipping() {
  console.log("TEST 6.4: Stop only sends when clipping");

  console.log("⚠ Manual test:");
  console.log("  1. Open popup (don't start clipping)");
  console.log("  2. Close popup");
  console.log("  3. Check content script console");
  console.log("  Expected: No stop messages (isClipping was false)");
  console.log("");
  console.log("  4. Open popup, start clipping");
  console.log("  5. Close popup");
  console.log("  6. Check content script console");
  console.log("  Expected: Stop messages appear (isClipping was true)");
}

// =============================================================================
// TEST SUITE 7: Cross-browser Compatibility
// =============================================================================

/**
 * TEST 7.1: extensionAPI wrapper works
 * Expected: extensionAPI is defined and has required methods
 */
function test_extension_api_wrapper() {
  console.log("TEST 7.1: Extension API wrapper is functional");

  const hasRuntime = extensionAPI && extensionAPI.runtime !== undefined;
  const hasTabs = extensionAPI && extensionAPI.tabs !== undefined;
  const hasStorage = extensionAPI && extensionAPI.storage !== undefined;

  console.assert(hasRuntime, 'Expected extensionAPI.runtime to exist');
  console.assert(hasTabs, 'Expected extensionAPI.tabs to exist');
  console.assert(hasStorage, 'Expected extensionAPI.storage to exist');

  const passed = hasRuntime && hasTabs && hasStorage;
  console.log(passed ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 7.2: Active tab can be queried
 * Expected: tabs.query returns current tab
 */
async function test_active_tab_query() {
  console.log("TEST 7.2: Active tab can be queried");

  const tabs = await extensionAPI.tabs.query({
    active: true,
    currentWindow: true
  });

  console.assert(tabs.length > 0, 'Expected at least one active tab');
  console.assert(tabs[0].id !== undefined, 'Expected tab to have ID');

  const passed = tabs.length > 0 && tabs[0].id !== undefined;
  console.log(passed ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST SUITE 8: Edge Cases
// =============================================================================

/**
 * TEST 8.1: Handles missing .CouponCount element gracefully
 * Expected: No errors when not on Kroger coupon page
 */
function test_handles_missing_elements() {
  console.log("TEST 8.1: Handles missing elements gracefully");

  console.log("⚠ Manual test:");
  console.log("  1. Open popup on non-Kroger page");
  console.log("  2. Click 'Start Clipping'");
  console.log("  3. Check for errors in console");
  console.log("  Expected: No errors, graceful handling");
}

/**
 * TEST 8.2: Multiple rapid clicks don't cause issues
 * Expected: Clicking Start Clipping multiple times is handled
 */
function test_rapid_clicks() {
  console.log("TEST 8.2: Rapid clicks are handled");

  const yesBtn = document.getElementById("yes");

  console.log("⚠ Manual test:");
  console.log("  1. Click 'Start Clipping' multiple times rapidly");
  console.log("  2. Check content script console");
  console.log("  Expected: Only one clipping process starts, no errors");
}

/**
 * TEST 8.3: Storage errors don't crash popup
 * Expected: Popup works even if storage fails
 */
async function test_storage_error_handling() {
  console.log("TEST 8.3: Storage errors are handled gracefully");

  // This is difficult to test without mocking, but we can check error handling exists
  console.log("⚠ Code review test:");
  console.log("  Check that storage.get/set calls have .catch() handlers");
  console.log("  Expected: All storage calls handle errors gracefully");
}

// =============================================================================
// TEST RUNNER
// =============================================================================

/**
 * Run all automated tests
 */
async function runAllPopupTests() {
  console.log("=".repeat(80));
  console.log("KROGER CLIPPER - POPUP SCRIPT TEST SUITE");
  console.log("=".repeat(80));

  // DOM and initial state
  console.log("\n--- SUITE 1: DOM Elements and Initial State ---");
  test_dom_elements_exist();
  test_filter_checkboxes_exist();
  test_initial_ui_state();
  test_default_filter_states();

  // Filter toggle
  console.log("\n--- SUITE 2: Filter Toggle Functionality ---");
  test_toggle_filters_button();
  test_filter_checkboxes_toggleable();

  // Storage
  console.log("\n--- SUITE 3: Storage Functionality ---");
  await test_filter_preferences_saved();
  await test_filter_preferences_loaded();
  await test_stop_flag_set_on_close();

  // Button handlers (mostly manual)
  console.log("\n--- SUITE 4: Button Click Handlers ---");
  test_cancel_button_closes_popup();
  test_close_button_closes_popup();
  test_start_clipping_updates_ui();
  test_start_clipping_sends_message();
  test_start_clipping_collects_filters();

  // Message handling (manual)
  console.log("\n--- SUITE 5: Message Handling ---");
  test_progress_message_updates_ui();
  test_done_message_updates_ui();
  test_limit_reached_message_updates_ui();

  // Stop functionality (manual)
  console.log("\n--- SUITE 6: Stop Functionality ---");
  test_visibilitychange_triggers_stop();
  test_pagehide_triggers_stop();
  await test_storage_flag_cleared_on_start();
  test_stop_only_when_clipping();

  // Cross-browser
  console.log("\n--- SUITE 7: Cross-browser Compatibility ---");
  test_extension_api_wrapper();
  await test_active_tab_query();

  // Edge cases
  console.log("\n--- SUITE 8: Edge Cases ---");
  test_handles_missing_elements();
  test_rapid_clicks();
  await test_storage_error_handling();

  console.log("\n" + "=".repeat(80));
  console.log("TEST SUITE COMPLETE");
  console.log("Note: Many tests require manual verification - check logs above");
  console.log("=".repeat(80));
}

// Export for manual execution
console.log("Popup tests loaded. Run runAllPopupTests() to execute.");
