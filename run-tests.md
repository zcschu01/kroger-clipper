# Quick Test Instructions

## Content Script Tests (clipper.test.js)

### Step 1: Navigate to Kroger
Go to: https://www.kroger.com/savings/cl/coupons/

### Step 2: Open Console
Press F12 or right-click → Inspect → Console tab

### Step 3: Paste clipper.js
Copy and paste the **entire** [clipper.js](clipper.js) file into the console and press Enter.

You should see output like:
```
Clipper tests loaded. Run runAllClipperTests() to execute.
```

### Step 4: Paste test file
Copy and paste the **entire** [clipper.test.js](clipper.test.js) file into the console and press Enter.

### Step 5: Run tests
Type this and press Enter:
```javascript
runAllClipperTests()
```

---

## Popup Tests (popup.test.js)

### Step 1: Open Popup
Click the Kroger Clipper extension icon

### Step 2: Inspect Popup
Right-click anywhere in the popup → "Inspect"

This opens a **separate** DevTools window for the popup.

### Step 3: Go to Console
In the popup's DevTools, click the Console tab

### Step 4: Paste test file
Copy and paste the **entire** [popup.test.js](popup.test.js) file into the console and press Enter.

### Step 5: Run tests
Type this and press Enter:
```javascript
runAllPopupTests()
```

---

## Expected Output

Tests will show:
- ✓ PASS - Test succeeded
- ✗ FAIL - Test failed (check assertion message)
- ⚠ SKIP - Test skipped to avoid side effects
- ⚠ Manual test - Follow printed instructions

---

## Common Errors

### "COUPON_FILTERS is not defined"
**Solution:** You forgot Step 3 - paste [clipper.js](clipper.js) first, then paste the test file.

### "extensionAPI is not defined"
**Solution:** Wrong context. For popup tests, must use popup's DevTools, not the main page DevTools.

### No coupons to clip
**Solution:** Make sure you're logged into Kroger and on the coupons page with actual coupons loaded.

---

## Quick Reference

| What to test | Where to paste | What to paste first |
|--------------|----------------|---------------------|
| Content script | Kroger page console | clipper.js, then clipper.test.js |
| Popup UI | Popup DevTools console | popup.test.js only |
