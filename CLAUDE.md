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
  2. **Clipping**: `clipAllCoupons()` clicks unclipped "Clip" buttons, validates they change to "Unclip", and tracks progress
  3. **Limit Detection**: Stops at 250 coupons (Kroger's hard limit) or when clip attempts fail

**Popup UI ([popup.html](popup.html) + [popup.js](popup.js))**
- Browser action popup with Yes/No confirmation
- Sends `start-clipping` message to active tab's content script
- Listens for progress updates (`progress`, `done`, `limit-reached`) from content script
- Auto-closes on completion

### Message Flow

1. User clicks extension icon → popup opens
2. User clicks "Yes" → `popup.js` sends `{ type: "start-clipping" }` to active tab
3. `clipper.js` receives message, runs workflow, sends progress updates back
4. Popup displays real-time progress and completion status

### Key Constraints

- **250 Coupon Limit**: Kroger enforces a 250 active coupon limit per account. The extension detects this by checking if buttons fail to change from "Clip" to "Unclip" after clicking.
- **Timing**: Uses 300ms delays between clips and 1000ms scroll intervals to avoid overwhelming the page or triggering rate limits.
- **DOM Selectors**: Relies on `.CouponCard-button`, `.CouponCount` classes. Changes to Kroger's DOM structure will break functionality.

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

## File Structure

```
kroger-clipper/
├── manifest.json          # Extension manifest (V3)
├── clipper.js            # Content script with clipping logic
├── popup.html            # Extension popup UI
├── popup.js              # Popup behavior and messaging
└── icons/                # Extension icons (48x48, 96x96)
```
