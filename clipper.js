// Firefox/Chrome compatibility wrapper
const extensionAPI = (() => {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  return window.browser || window.chrome;
})();

// Coupon category filters
const COUPON_FILTERS = {
  freeItems: true,           // Free items, BOGO, buy X get Y free
  freshProduce: true,        // Fruits, vegetables
  meat: true,                // Beef, chicken, pork, seafood
  dairy: true,               // Milk, cheese, yogurt, eggs
  bakery: true,              // Bread, baked goods
  pantryStaples: true,       // Canned goods, pasta, rice, cereal
  frozenFoods: true,         // Frozen meals, vegetables, ice cream
  snacks: true,              // Chips, cookies, candy
  beverages: true,           // Soda, juice, coffee, tea (non-alcoholic)
  healthBeauty: true,        // Toiletries, cosmetics, vitamins
  household: true,           // Cleaning supplies, paper products
  baby: true,                // Diapers, baby food, formula
  pet: true,                 // Pet food, pet supplies

  // Excluded by default
  alcohol: false,            // Beer, wine, spirits
  tobacco: false             // Cigarettes, vaping products
};

// Keywords for category detection
const CATEGORY_KEYWORDS = {
  freeItems: ['free', 'bogo', 'buy one get one', 'buy 1 get 1', 'buy 2 get 1', 'buy two get one'],
  alcohol: ['beer', 'wine', 'vodka', 'whiskey', 'rum', 'tequila', 'gin', 'champagne', 'liquor', 'spirits', 'cocktail', 'alcoholic'],
  tobacco: ['cigarette', 'cigar', 'tobacco', 'vape', 'vaping', 'nicotine'],
  freshProduce: ['fruit', 'vegetable', 'produce', 'apple', 'banana', 'orange', 'lettuce', 'tomato', 'carrot', 'berry', 'salad'],
  meat: ['beef', 'chicken', 'pork', 'turkey', 'ham', 'bacon', 'sausage', 'seafood', 'fish', 'salmon', 'shrimp', 'steak', 'ground beef'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'dairy'],
  bakery: ['bread', 'bagel', 'muffin', 'donut', 'cake', 'pastry', 'bakery', 'rolls'],
  pantryStaples: ['pasta', 'rice', 'cereal', 'canned', 'soup', 'beans', 'sauce', 'oil', 'flour', 'sugar'],
  frozenFoods: ['frozen', 'ice cream', 'pizza'],
  snacks: ['chips', 'cookie', 'candy', 'chocolate', 'popcorn', 'crackers', 'snack'],
  beverages: ['soda', 'juice', 'coffee', 'tea', 'water', 'energy drink', 'lemonade'],
  healthBeauty: ['shampoo', 'soap', 'toothpaste', 'deodorant', 'cosmetic', 'lotion', 'vitamin', 'medicine'],
  household: ['detergent', 'cleaner', 'paper towel', 'toilet paper', 'dish soap', 'trash bag'],
  baby: ['diaper', 'baby food', 'formula', 'wipes', 'baby'],
  pet: ['dog food', 'cat food', 'pet', 'treats', 'litter']
};

// Active filters (will be updated from popup)
let activeFilters = { ...COUPON_FILTERS };

function shouldClipCoupon(couponCard) {
  // Get the coupon text content for analysis
  const text = couponCard.textContent.toLowerCase();

  // Check if it matches any disabled category
  for (const [category, enabled] of Object.entries(activeFilters)) {
    if (!enabled) {
      // If category is disabled and matches, reject the coupon
      const keywords = CATEGORY_KEYWORDS[category] || [];
      if (keywords.some(keyword => text.includes(keyword))) {
        console.log(`Skipping coupon (${category}):`, couponCard.textContent.trim().substring(0, 50));
        return false;
      }
    }
  }

  // Check if it matches any enabled "priority" categories (like free items)
  for (const [category, enabled] of Object.entries(activeFilters)) {
    if (enabled) {
      const keywords = CATEGORY_KEYWORDS[category] || [];
      if (keywords.some(keyword => text.includes(keyword))) {
        console.log(`Clipping coupon (${category}):`, couponCard.textContent.trim().substring(0, 50));
        return true;
      }
    }
  }

  // If no specific category detected, allow by default (unless it's explicitly filtered)
  return true;
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

      // Find the coupon card parent element
      const couponCard = btn.closest('.CouponCard') || btn.closest('[class*="Coupon"]') || btn.parentElement;

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
        extensionAPI.runtime.sendMessage({ type: "limit-reached" });
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
        clipped: totalClipped,
        total: totalExpected,
      });
    } catch {}

    // Check if we've hit the 250 limit
    if (totalClipped >= 250) {
      console.warn("250 coupon limit reached — stopping.");
      try {
        extensionAPI.runtime.sendMessage({ type: "limit-reached" });
      } catch {}
      return true;
    }
  } // end while loop

  return false;
}

async function runClippingWorkflow() {
  totalClipped = 0;
  const totalExpected =
    parseInt(document.querySelector(".CouponCount")?.textContent || "0", 10) ||
    0;

  await scrollToLoadAllCoupons(totalExpected);
  const hitLimit = await clipAllCoupons(totalExpected);

  if (!hitLimit) {
    try {
      extensionAPI.runtime.sendMessage({ type: "done" });
    } catch {}
  }
}