# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kroger Clipper is a Chrome extension (Manifest V3) that automatically clips all available coupons on Kroger's coupon page. The extension operates entirely client-side with no build step or dependencies.

## Architecture

### Core Components

**Content Script ([clipper.js](clipper.js))**
- Injected into `https://www.kroger.com/savings/cl/coupons/*`
- Runs at `document_idle` to ensure page is fully loaded
- Implements the auto-clipping workflow in three phases:
  1. **Scrolling**: `scrollToLoadAllCoupons()` progressively scrolls to lazy-load all coupon cards (detected via `.CouponCount` element)
  2. **Clipping**: `clipAllCoupons()` clicks unclipped "Clip" buttons with category filtering and tracks progress
  3. **Limit Detection**: Stops at 250 coupons (Kroger's hard limit) or when user closes popup

**Popup UI ([popup.html](popup.html) + [popup.js](popup.js))**
- Browser action popup with category filters and Start/Cancel buttons
- Filter UI allows selecting which coupon categories to clip (Gift Cards, Produce, Meat, etc.)
- Sends `start-clipping` message with filter preferences to content script
- Listens for progress updates (`progress`, `done`, `limit-reached`) from content script
- X button to manually close and stop clipping
- Automatically stops clipping when popup loses focus or closes

### Message Flow

1. User clicks extension icon → popup opens
2. User clicks "Yes" → `popup.js` sends `{ type: "start-clipping" }` to active tab
3. `clipper.js` receives message, runs workflow, sends progress updates back
4. Popup displays real-time progress and completion status

### Category Filtering

The extension uses Kroger's actual category metadata for reliable filtering:

- **Dynamic Discovery**: `extractCategoriesFromPage()` scrapes Kroger's filter UI to discover available categories
- **Data Attribute**: Reads `data-category` attribute from `.CouponCardNew` elements
- **Filter Logic**: "Any enabled category allows" - a coupon is clipped if it has ANY enabled category, regardless of disabled categories
- **Excluded by Default**: Adult Beverage, Tobacco (defined in `EXCLUDED_BY_DEFAULT` constant)
- **Storage**: Categories stored in `storage.local.availableCategories`, user preferences in `storage.sync.couponFilters`

### Key Constraints

- **250 Coupon Limit**: Kroger enforces a 250 active coupon limit per account. Extension tracks total clipped and stops at 250.
- **Timing**: Uses minimal delays (20ms between clips, 1000ms scroll intervals) for fast performance (~5 seconds for 250 coupons).
- **DOM Selectors**: Relies on `.CouponCard-button`, `.CouponCardNew[data-category]`, `.CouponCount` classes. Changes to Kroger's DOM structure will break functionality.
- **Stop on Close**: Clipping stops automatically when popup loses focus or closes (uses storage flag + message passing).

## Development

### Testing the Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this repository directory
5. Navigate to `https://www.kroger.com/savings/cl/coupons/` (requires logged-in Kroger account)
6. Click the extension icon and test clipping workflow

### Making Changes

- **No build process**: Edit files directly and reload the extension via `chrome://extensions/`
- **Content script changes**: Require full extension reload
- **Popup changes**: Close and reopen popup to see updates
- **Manifest changes**: Always require extension reload

### Debugging

- **Content script logs**: Open DevTools on the Kroger coupons page (Console tab shows `clipper.js` logs)
- **Popup logs**: Right-click extension icon → "Inspect popup" (separate DevTools instance)
- **Message passing**: Check for `chrome.runtime.lastError` if messages fail to send/receive

### Running Tests

The extension has manual test suites that must be run in the browser:

**Content Script Tests** ([clipper.test.js](clipper.test.js)):
1. Navigate to https://www.kroger.com/savings/cl/coupons/
2. Open DevTools Console (F12)
3. **First**: Paste entire [clipper.js](clipper.js) into console and press Enter
4. **Then**: Paste entire [clipper.test.js](clipper.test.js) into console and press Enter
5. Run: `runAllClipperTests()`

**Popup Tests** ([popup.test.js](popup.test.js)):
1. Click extension icon to open popup
2. Right-click popup → "Inspect" (opens separate DevTools)
3. Paste [popup.test.js](popup.test.js) into popup's console
4. Run: `runAllPopupTests()`

See [TESTING.md](TESTING.md) for detailed test documentation and [run-tests.md](run-tests.md) for quick reference.

## File Structure

```
kroger-clipper/
├── manifest.json          # Extension manifest (V3)
├── clipper.js            # Content script with clipping logic
├── clipper.test.js       # Content script tests (19 tests)
├── popup.html            # Extension popup UI
├── popup.js              # Popup behavior and messaging
├── popup.test.js         # Popup tests (26 tests)
├── TESTING.md            # Comprehensive testing guide
├── run-tests.md          # Quick test instructions
└── icons/                # Extension icons (48x48, 96x96)
```
