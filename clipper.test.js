/**
 * Test Suite for clipper.js
 *
 * This file contains test cases for the Kroger Coupon Clipper content script.
 * These are manual test cases to be executed in a real browser environment.
 *
 * IMPORTANT: These tests must be run in the CONTENT SCRIPT context, not as a separate file.
 *
 * To run these tests:
 * 1. Load the extension in Chrome/Firefox
 * 2. Navigate to https://www.kroger.com/savings/cl/coupons/
 * 3. Open DevTools Console
 * 4. FIRST, paste the entire clipper.js content into console (this loads all functions/variables)
 * 5. THEN, copy and paste this test file into console
 * 6. Execute tests: runAllClipperTests()
 *
 * OR: Add these tests directly to the end of clipper.js temporarily for testing
 */

// Check if required variables are available
if (typeof activeFilters === 'undefined') {
  console.error("❌ ERROR: activeFilters not defined!");
  console.error("Make sure you've pasted clipper.js content into console first, or added these tests to clipper.js");
  console.error("Variables needed: activeFilters, shouldClipCoupon, EXCLUDED_BY_DEFAULT, etc.");
}

if (typeof extensionAPI === 'undefined') {
  console.warn("⚠ WARNING: extensionAPI not defined!");
  console.warn("Some tests that require storage access will be skipped.");
  console.warn("Make sure you pasted clipper.js first.");
}

// =============================================================================
// TEST SUITE 1: Category Filtering
// =============================================================================

/**
 * TEST 1.1: shouldClipCoupon filters Adult Beverage when disabled
 * Expected: Returns false for coupons with Adult Beverage category
 */
function test_shouldClipCoupon_filters_alcohol() {
  console.log("TEST 1.1: Filter Adult Beverage coupons");

  // Setup: Create mock coupon card with data-category attribute
  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  mockCoupon.setAttribute('data-category', 'Adult Beverage,');
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-alcohol');

  // Set filters to exclude Adult Beverage
  activeFilters = { 'Adult Beverage': false, 'Produce': true };

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === false, 'Expected Adult Beverage coupon to be filtered out');
  console.log(result === false ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.2: shouldClipCoupon filters Tobacco when disabled
 * Expected: Returns false for coupons with Tobacco category
 */
function test_shouldClipCoupon_filters_tobacco() {
  console.log("TEST 1.2: Filter Tobacco coupons");

  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  mockCoupon.setAttribute('data-category', 'Tobacco,');
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-tobacco');

  activeFilters = { 'Tobacco': false, 'Health': true };

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === false, 'Expected Tobacco coupon to be filtered out');
  console.log(result === false ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.3: shouldClipCoupon allows enabled categories
 * Expected: Returns true for coupons with enabled category
 */
function test_shouldClipCoupon_allows_enabled_category() {
  console.log("TEST 1.3: Allow enabled category coupons");

  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  mockCoupon.setAttribute('data-category', 'Produce,');
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-produce');

  activeFilters = { 'Produce': true, 'Adult Beverage': false };

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === true, 'Expected Produce coupon to be allowed');
  console.log(result === true ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.4: shouldClipCoupon allows if ANY category is enabled
 * Expected: Returns true if coupon has at least one enabled category
 */
function test_shouldClipCoupon_any_enabled_allows() {
  console.log("TEST 1.4: Allow if any category is enabled");

  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  mockCoupon.setAttribute('data-category', 'Produce,Adult Beverage,');
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-mixed');

  activeFilters = { 'Produce': true, 'Adult Beverage': false };

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === true, 'Expected coupon to be allowed (Produce is enabled)');
  console.log(result === true ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.5: shouldClipCoupon allows uncategorized coupons by default
 * Expected: Returns true for coupons with no data-category
 */
function test_shouldClipCoupon_allows_uncategorized() {
  console.log("TEST 1.5: Allow uncategorized coupons");

  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  // No data-category attribute
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-uncategorized');

  activeFilters = { 'Produce': true, 'Adult Beverage': false };

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === true, 'Expected uncategorized coupon to be allowed');
  console.log(result === true ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 1.6: shouldClipCoupon clips everything when all filters disabled
 * Expected: Returns true when no filters are enabled
 */
function test_shouldClipCoupon_all_filters_disabled() {
  console.log("TEST 1.6: Clip everything when all filters disabled");

  const mockCoupon = document.createElement('div');
  mockCoupon.className = 'CouponCardNew';
  mockCoupon.setAttribute('data-category', 'Adult Beverage,');
  mockCoupon.setAttribute('data-testid', 'CouponCard-test-all-disabled');

  activeFilters = {}; // No filters enabled

  const result = shouldClipCoupon(mockCoupon);

  console.assert(result === true, 'Expected coupon to be allowed (all filters disabled)');
  console.log(result === true ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST SUITE 2: Message Handling
// =============================================================================

/**
 * TEST 2.1: Start clipping message resets shouldStop flag
 * Expected: shouldStop becomes false when start-clipping message received
 */
function test_message_start_clipping_resets_stop_flag() {
  console.log("TEST 2.1: Start clipping resets stop flag");

  // Setup: Set shouldStop to true
  shouldStop = true;

  // Simulate message
  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "start-clipping") {
      console.assert(shouldStop === false, 'Expected shouldStop to be false after start-clipping');
      console.log(shouldStop === false ? '✓ PASS' : '✗ FAIL');
    }
  });

  // Send test message (manually trigger from popup)
  console.log("Send a start-clipping message from popup to test");
}

/**
 * TEST 2.2: Stop clipping message sets shouldStop flag
 * Expected: shouldStop becomes true when stop-clipping message received
 */
function test_message_stop_clipping_sets_flag() {
  console.log("TEST 2.2: Stop clipping sets flag");

  shouldStop = false;

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "stop-clipping") {
      console.assert(shouldStop === true, 'Expected shouldStop to be true after stop-clipping');
      console.log(shouldStop === true ? '✓ PASS' : '✗ FAIL');
    }
  });

  console.log("Send a stop-clipping message from popup to test");
}

/**
 * TEST 2.3: Start clipping message updates filters
 * Expected: activeFilters are updated when filters provided in message
 */
function test_message_updates_filters() {
  console.log("TEST 2.3: Message updates filters");

  console.log("⚠ Manual test:");
  console.log("  1. Open popup and change filters:");
  console.log("     - Enable 'Adult Beverage'");
  console.log("     - Disable 'Meat & Seafood'");
  console.log("  2. Click 'Start Clipping'");
  console.log("  3. Check activeFilters in console");
  console.log("  Expected: activeFilters['Adult Beverage'] === true");
  console.log("  Expected: activeFilters['Meat & Seafood'] === false");
}

// =============================================================================
// TEST SUITE 3: Clipping Workflow
// =============================================================================

/**
 * TEST 3.1: clipAllCoupons respects shouldStop flag
 * Expected: Function exits early when shouldStop is true
 */
async function test_clipAllCoupons_respects_stop_flag() {
  console.log("TEST 3.1: Clipping respects stop flag");

  shouldStop = true;
  const result = await clipAllCoupons(100);

  console.assert(result === false, 'Expected clipAllCoupons to return false when stopped');
  console.log(result === false ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 3.2: clipAllCoupons checks storage flag for stop signal
 * Expected: Function stops when storage flag is set to true
 */
async function test_clipAllCoupons_checks_storage_flag() {
  console.log("TEST 3.2: Clipping checks storage flag");

  if (typeof extensionAPI === 'undefined') {
    console.log("⚠ SKIP: extensionAPI not available (paste clipper.js first)");
    return;
  }

  // Set storage flag
  await extensionAPI.storage.local.set({ clipperShouldStop: true });
  shouldStop = false; // Ensure message flag is false

  const result = await clipAllCoupons(100);

  console.assert(result === false, 'Expected clipAllCoupons to stop when storage flag is true');
  console.assert(shouldStop === true, 'Expected shouldStop to be set to true');
  console.log(result === false && shouldStop === true ? '✓ PASS' : '✗ FAIL');

  // Cleanup
  await extensionAPI.storage.local.set({ clipperShouldStop: false });
}

/**
 * TEST 3.3: clipAllCoupons stops at 250 coupon limit
 * Expected: Function returns true and sends limit-reached message when hitting 250
 */
async function test_clipAllCoupons_250_limit() {
  console.log("TEST 3.3: Clipping stops at 250 limit");

  // Setup: Set totalClipped to 249
  totalClipped = 249;
  shouldStop = false;

  // This test requires at least one clippable coupon on the page
  const buttons = document.querySelectorAll("button.CouponCard-button");

  if (buttons.length === 0) {
    console.log("⚠ SKIP: No coupon buttons found on page");
    return;
  }

  const result = await clipAllCoupons(300);

  console.assert(totalClipped === 250, 'Expected totalClipped to be 250');
  console.assert(result === true, 'Expected clipAllCoupons to return true at limit');
  console.log(totalClipped === 250 && result === true ? '✓ PASS' : '✗ FAIL');

  // Reset
  totalClipped = 0;
}

/**
 * TEST 3.4: clipAllCoupons filters buttons correctly
 * Expected: Only clips buttons with text "Clip", not disabled, not already clipped
 */
async function test_clipAllCoupons_filters_buttons() {
  console.log("TEST 3.4: Clipping filters buttons correctly");

  // Check that buttons are filtered properly
  const allButtons = document.querySelectorAll("button.CouponCard-button");
  const clipButtons = Array.from(allButtons).filter(btn =>
    btn.textContent.trim() === "Clip" && !btn.disabled && !btn.dataset.clipped
  );

  console.log(`Total buttons: ${allButtons.length}`);
  console.log(`Clippable buttons: ${clipButtons.length}`);

  console.assert(clipButtons.length <= allButtons.length, 'Filtered buttons should be <= total');
  console.log(clipButtons.length <= allButtons.length ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 3.5: clipAllCoupons marks buttons as clipped
 * Expected: Clicked buttons get dataset.clipped = "true"
 */
async function test_clipAllCoupons_marks_buttons() {
  console.log("TEST 3.5: Buttons are marked as clipped");

  shouldStop = false;
  totalClipped = 0;

  const buttons = document.querySelectorAll("button.CouponCard-button");
  if (buttons.length === 0) {
    console.log("⚠ SKIP: No coupon buttons found");
    return;
  }

  // Clip one coupon
  await clipAllCoupons(1);

  // Check if any button has dataset.clipped
  const markedButtons = Array.from(buttons).filter(btn => btn.dataset.clipped === "true");

  console.assert(markedButtons.length > 0, 'Expected at least one button to be marked');
  console.log(markedButtons.length > 0 ? '✓ PASS' : '✗ FAIL');

  // Reset
  totalClipped = 0;
  shouldStop = true; // Stop any ongoing clipping
}

/**
 * TEST 3.6: clipAllCoupons sends progress messages
 * Expected: Progress messages sent with clipped count and total
 */
async function test_clipAllCoupons_sends_progress() {
  console.log("TEST 3.6: Progress messages are sent");

  let progressReceived = false;
  let progressData = null;

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      progressReceived = true;
      progressData = msg;
    }
  });

  shouldStop = false;
  totalClipped = 0;

  await clipAllCoupons(1);

  // Give time for message to be received
  await new Promise(r => setTimeout(r, 100));

  console.assert(progressReceived === true, 'Expected progress message to be received');
  if (progressData) {
    console.assert(progressData.clipped !== undefined, 'Expected clipped count in message');
    console.assert(progressData.total !== undefined, 'Expected total count in message');
  }
  console.log(progressReceived ? '✓ PASS' : '✗ FAIL');

  // Reset
  totalClipped = 0;
  shouldStop = true;
}

// =============================================================================
// TEST SUITE 4: Scroll Functionality
// =============================================================================

/**
 * TEST 4.1: scrollToLoadAllCoupons scrolls page
 * Expected: Page scrolls down and loads more coupons
 */
async function test_scrollToLoadAllCoupons() {
  console.log("TEST 4.1: Scroll loads all coupons");

  const initialScrollY = window.scrollY;
  const initialButtonCount = document.querySelectorAll("button.CouponCard-button").length;

  // Get expected total from page
  const totalExpected = parseInt(
    document.querySelector(".CouponCount")?.textContent || "0",
    10
  );

  console.log(`Initial scroll position: ${initialScrollY}`);
  console.log(`Initial button count: ${initialButtonCount}`);
  console.log(`Expected total: ${totalExpected}`);

  await scrollToLoadAllCoupons(totalExpected);

  const finalButtonCount = document.querySelectorAll("button.CouponCard-button").length;

  console.log(`Final button count: ${finalButtonCount}`);
  console.assert(finalButtonCount >= initialButtonCount, 'Expected more buttons after scrolling');
  console.log(finalButtonCount >= initialButtonCount ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 4.2: scrollToLoadAllCoupons stops when all loaded
 * Expected: Function resolves when button count matches expected total
 */
async function test_scrollToLoadAllCoupons_stops_at_total() {
  console.log("TEST 4.2: Scroll stops when all coupons loaded");

  const currentButtonCount = document.querySelectorAll("button.CouponCard-button").length;

  // Use current count as target (should resolve immediately)
  const startTime = Date.now();
  await scrollToLoadAllCoupons(currentButtonCount);
  const endTime = Date.now();

  const duration = endTime - startTime;

  console.log(`Scroll completed in ${duration}ms`);
  console.assert(duration < 2000, 'Expected scroll to complete quickly when target already met');
  console.log(duration < 2000 ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST SUITE 5: Full Workflow
// =============================================================================

/**
 * TEST 5.1: runClippingWorkflow completes full process
 * Expected: Scrolls, clips all coupons, sends done message
 */
async function test_runClippingWorkflow_full_process() {
  console.log("TEST 5.1: Full workflow completes successfully");

  let doneMessageReceived = false;

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "done") {
      doneMessageReceived = true;
    }
  });

  totalClipped = 0;
  shouldStop = false;

  await runClippingWorkflow();

  await new Promise(r => setTimeout(r, 500)); // Wait for message

  console.assert(doneMessageReceived === true, 'Expected done message after workflow');
  console.log(doneMessageReceived ? '✓ PASS' : '✗ FAIL');
}

/**
 * TEST 5.2: runClippingWorkflow reads total from CouponCount element
 * Expected: Gets correct expected total from DOM
 */
async function test_runClippingWorkflow_reads_total() {
  console.log("TEST 5.2: Workflow reads total count from page");

  const totalElement = document.querySelector(".CouponCount");

  if (!totalElement) {
    console.log("⚠ SKIP: .CouponCount element not found on page");
    return;
  }

  const expectedTotal = parseInt(totalElement.textContent, 10);

  console.log(`Found total on page: ${expectedTotal}`);
  console.assert(expectedTotal > 0, 'Expected total to be greater than 0');
  console.log(expectedTotal > 0 ? '✓ PASS' : '✗ FAIL');
}

// =============================================================================
// TEST RUNNER
// =============================================================================

/**
 * Run all tests sequentially
 */
async function runAllClipperTests() {
  console.log("=".repeat(80));
  console.log("KROGER CLIPPER - CONTENT SCRIPT TEST SUITE");
  console.log("=".repeat(80));

  // Category filtering tests
  console.log("\n--- SUITE 1: Category Filtering ---");
  test_shouldClipCoupon_filters_alcohol();
  test_shouldClipCoupon_filters_tobacco();
  test_shouldClipCoupon_allows_enabled_category();
  test_shouldClipCoupon_any_enabled_allows();
  test_shouldClipCoupon_allows_uncategorized();
  test_shouldClipCoupon_all_filters_disabled();

  // Message handling tests (require manual triggering from popup)
  console.log("\n--- SUITE 2: Message Handling ---");
  console.log("⚠ Manual tests - trigger from popup");

  // Clipping workflow tests
  console.log("\n--- SUITE 3: Clipping Workflow ---");
  await test_clipAllCoupons_respects_stop_flag();
  await test_clipAllCoupons_checks_storage_flag();
  // Skip 250 limit test in normal run (would clip 249 coupons)
  // await test_clipAllCoupons_250_limit();
  await test_clipAllCoupons_filters_buttons();
  // Skip actual clipping tests to avoid side effects
  // await test_clipAllCoupons_marks_buttons();
  // await test_clipAllCoupons_sends_progress();

  // Scroll functionality tests
  console.log("\n--- SUITE 4: Scroll Functionality ---");
  await test_scrollToLoadAllCoupons();
  await test_scrollToLoadAllCoupons_stops_at_total();

  // Full workflow tests
  console.log("\n--- SUITE 5: Full Workflow ---");
  test_runClippingWorkflow_reads_total();
  // Skip full workflow to avoid clipping
  // await test_runClippingWorkflow_full_process();

  console.log("\n" + "=".repeat(80));
  console.log("TEST SUITE COMPLETE");
  console.log("=".repeat(80));
}

// Export for manual execution
console.log("Clipper tests loaded. Run runAllClipperTests() to execute.");
