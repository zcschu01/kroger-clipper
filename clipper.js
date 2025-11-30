// Firefox/Chrome compatibility wrapper
const extensionAPI = (() => {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  return window.browser || window.chrome;
})();

// Categories that should be disabled by default
const EXCLUDED_BY_DEFAULT = ['Adult Beverage', 'Tobacco'];

// Extract available categories from Kroger's filter UI
function extractCategoriesFromPage() {
  const categories = [];
  const filterCheckboxes = document.querySelectorAll('input[data-testid^="Filter-by-"]');

  filterCheckboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    if (label) {
      const categoryText = label.querySelector('span.truncate');
      if (categoryText) {
        const categoryName = categoryText.textContent.trim();
        categories.push(categoryName);
      }
    }
  });

  console.log('[Kroger Clipper] Found categories:', categories);
  return categories;
}

// Initialize category filters based on discovered categories
async function initializeCategoryFilters() {
  const categories = extractCategoriesFromPage();

  if (categories.length === 0) {
    console.log('[Kroger Clipper] No categories found, page may not be loaded yet');
    return null;
  }

  // Build default filter state
  const filters = {};
  categories.forEach(category => {
    filters[category] = !EXCLUDED_BY_DEFAULT.includes(category);
  });

  // Store categories in extension storage for popup to use
  await extensionAPI.storage.local.set({
    availableCategories: categories,
    defaultFilters: filters
  });

  console.log('[Kroger Clipper] Initialized filters:', filters);
  return filters;
}

// Active filters (will be updated from popup or initialized from page)
let activeFilters = {};

function shouldClipCoupon(couponCard) {
  // Check if all filters are disabled (means clip everything)
  const hasAnyFilterEnabled = Object.values(activeFilters).some(enabled => enabled === true);

  if (!hasAnyFilterEnabled) {
    console.log('All filters disabled - clipping everything');
    return true;
  }

  // Get Kroger's category data from the coupon card
  const categoryAttr = couponCard.getAttribute('data-category');

  if (!categoryAttr) {
    // No category data - allow by default
    console.log('No category data, allowing coupon');
    return true;
  }

  // Split categories (Kroger uses comma-separated values)
  const categories = categoryAttr.split(',').map(c => c.trim()).filter(c => c);

  // If the coupon has ANY enabled category, clip it
  for (const category of categories) {
    if (activeFilters[category] === true) {
      console.log(`Clipping coupon (${category} enabled):`, couponCard.getAttribute('data-testid'));
      return true;
    }
  }

  // If we got here, none of the coupon's categories are enabled
  // Check if coupon has any known categories
  let hasKnownCategory = false;
  for (const category of categories) {
    if (category in activeFilters) {
      hasKnownCategory = true;
      break;
    }
  }

  // If coupon has no known categories, allow by default
  if (!hasKnownCategory) {
    console.log('No known categories, allowing coupon');
    return true;
  }

  // All of this coupon's categories are disabled
  console.log(`Skipping coupon (all categories disabled):`, couponCard.getAttribute('data-testid'));
  return false;
}

let shouldStop = false;

extensionAPI.runtime.onMessage.addListener((msg) => {
  if (msg.type === "start-clipping") {
    // Update filters if provided
    if (msg.filters) {
      activeFilters = msg.filters;
      console.log("Updated filters:", activeFilters);
    }
    shouldStop = false;
    runClippingWorkflow();
  } else if (msg.type === "stop-clipping") {
    console.log("Stopping clipping process...");
    shouldStop = true;
  }
});

async function scrollToLoadAllCoupons(totalExpected) {
  const scrollDelay = 1000;
  const postScrollWait = 500;

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const currentCount = document.querySelectorAll(
        "button.CouponCard-button"
      ).length;

      if (currentCount >= totalExpected) {
        clearInterval(interval);
        resolve();
      }

      window.scrollBy({ top: 1000, behavior: "smooth" });
      await new Promise((r) => setTimeout(r, postScrollWait));
    }, scrollDelay);
  });
}

let totalClipped = 0;
let limitReached = false;
async function clipAllCoupons(totalExpected) {
  let clippedThisSession = 0;

  // Keep clipping until no more eligible buttons are found
  while (true) {
    // Check if user requested stop (via message or storage flag)
    if (shouldStop) {
      console.log("Clipping stopped by user");
      return false;
    }

    // Also check storage flag (more reliable when popup closes)
    try {
      const result = await extensionAPI.storage.local.get('clipperShouldStop');
      if (result && result.clipperShouldStop === true) {
        console.log("Clipping stopped by storage flag");
        shouldStop = true;
        return false;
      }
    } catch (e) {
      // Ignore storage errors
    }

    // Re-query buttons each iteration to get fresh state
    const buttons = Array.from(
      document.querySelectorAll("button.CouponCard-button")
    ).filter((btn) => {
      // Basic button state checks
      if (btn.textContent.trim() !== "Clip" || btn.disabled || btn.dataset.clipped) {
        return false;
      }

      // Find the coupon card parent element with data-category attribute
      const couponCard = btn.closest('.CouponCardNew[data-category]');

      if (!couponCard) {
        // No coupon card found - allow by default
        return true;
      }

      // Apply category filter
      return shouldClipCoupon(couponCard);
    });

    if (buttons.length === 0) {
      console.log("No more coupons to clip!");
      break; // No more buttons to clip
    }

    console.log(`Found ${buttons.length} coupons remaining to clip`);

    // Take the first button from the fresh list
    const btn = buttons[0];
    if (totalClipped >= 250) {
      console.warn("250 coupon limit reached — stopping.");
      try {
        extensionAPI.runtime.sendMessage({
          type: "limit-reached",
          totalClipped: totalClipped
        });
      } catch {}
      return true;
    }

    console.log(`Clipping coupon ${clippedThisSession + 1} (${buttons.length} remaining)`);

    btn.click();
    btn.dataset.clipped = "true";

    // Minimal delay to let the click register
    await new Promise((r) => setTimeout(r, 20));

    totalClipped++;
    clippedThisSession++;

    try {
      extensionAPI.runtime.sendMessage({
        type: "progress",
        clipped: clippedThisSession,
        total: totalExpected,
      });
    } catch {}

    // Check if we've hit the 250 limit
    if (totalClipped >= 250) {
      console.warn("250 coupon limit reached — stopping.");
      try {
        extensionAPI.runtime.sendMessage({
          type: "limit-reached",
          totalClipped: totalClipped
        });
      } catch {}
      return true;
    }
  } // end while loop

  return false;
}

// Count eligible coupons after filtering
function countEligibleCoupons() {
  const buttons = Array.from(
    document.querySelectorAll("button.CouponCard-button")
  ).filter((btn) => {
    // Basic button state checks
    if (btn.textContent.trim() !== "Clip" || btn.disabled || btn.dataset.clipped) {
      return false;
    }

    // Find the coupon card parent element with data-category attribute
    const couponCard = btn.closest('.CouponCardNew[data-category]');

    if (!couponCard) {
      // No coupon card found - allow by default
      return true;
    }

    // Apply category filter
    return shouldClipCoupon(couponCard);
  });

  return buttons.length;
}

async function runClippingWorkflow() {
  totalClipped = 0;
  const totalOnPage =
    parseInt(document.querySelector(".CouponCount")?.textContent || "0", 10) ||
    0;

  // Scroll to load all coupons
  await scrollToLoadAllCoupons(totalOnPage);

  // Count eligible coupons after filtering
  const eligibleCount = countEligibleCoupons();
  console.log(`[Kroger Clipper] Found ${eligibleCount} eligible coupons out of ${totalOnPage} total`);

  // Clip with accurate count
  const hitLimit = await clipAllCoupons(eligibleCount);

  if (!hitLimit) {
    try {
      extensionAPI.runtime.sendMessage({
        type: "done",
        totalClipped: totalClipped
      });
    } catch {}
  }
}

// Initialize categories when page loads
(async function initializeOnLoad() {
  // Wait for the page to be fully loaded
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // Wait a bit for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Extract and initialize categories
  const filters = await initializeCategoryFilters();

  if (filters) {
    // Check if user has saved preferences
    const saved = await extensionAPI.storage.sync.get('couponFilters');
    if (saved && saved.couponFilters) {
      activeFilters = saved.couponFilters;
      console.log('[Kroger Clipper] Loaded saved filters:', activeFilters);
    } else {
      activeFilters = filters;
      console.log('[Kroger Clipper] Using default filters:', activeFilters);
    }
  }
})();