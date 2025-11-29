// Firefox/Chrome compatibility wrapper
const extensionAPI = (() => {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  // Fallback - try window scope
  return window.browser || window.chrome;
})();

const FILTER_CATEGORIES = [
  'freeItems', 'freshProduce', 'meat', 'dairy', 'bakery',
  'pantryStaples', 'frozenFoods', 'snacks', 'beverages',
  'healthBeauty', 'household', 'baby', 'pet', 'alcohol', 'tobacco'
];

document.addEventListener("DOMContentLoaded", async () => {
  const yesBtn = document.getElementById("yes");
  const noBtn = document.getElementById("no");
  const progress = document.getElementById("progress");
  const toggleFiltersBtn = document.getElementById("toggleFilters");
  const filtersSection = document.querySelector(".filters-section");
  const closeBtn = document.getElementById("closeBtn");

  let isClipping = false;
  let currentTab = null;

  // Get the active tab
  currentTab = (await extensionAPI.tabs.query({
    active: true,
    currentWindow: true,
  }))[0];

  // Function to stop clipping
  const stopClipping = () => {
    if (isClipping && currentTab) {
      console.log("Stopping clipping...");

      // Set flag in storage that content script can check
      extensionAPI.storage.local.set({ clipperShouldStop: true });

      // Also try to send message (may not complete if popup is closing)
      try {
        extensionAPI.tabs.sendMessage(currentTab.id, {
          type: "stop-clipping"
        });
      } catch (e) {
        console.error("Failed to send stop message:", e);
      }
      isClipping = false;
    }
  };

  // Stop clipping when popup becomes hidden (loses focus or closes)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("Popup hidden (visibilitychange)");
      stopClipping();
    }
  });

  // Also listen for pagehide which fires when popup closes
  window.addEventListener("pagehide", () => {
    console.log("Popup closing (pagehide)");
    stopClipping();
  });

  // And beforeunload as a backup
  window.addEventListener("beforeunload", () => {
    console.log("Popup closing (beforeunload)");
    stopClipping();
  });

  // Toggle filters visibility
  let filtersVisible = false;
  toggleFiltersBtn.addEventListener("click", () => {
    filtersVisible = !filtersVisible;
    filtersSection.style.display = filtersVisible ? 'block' : 'none';
    toggleFiltersBtn.textContent = filtersVisible ? 'Hide Filters' : 'Show Filters';
  });

  // Load saved filter preferences
  extensionAPI.storage.sync.get('couponFilters').then((result) => {
    const filters = (result && result.couponFilters) || {};

    FILTER_CATEGORIES.forEach(category => {
      const checkbox = document.getElementById(category);
      if (checkbox && filters[category] !== undefined) {
        checkbox.checked = filters[category];
      }
    });
  }).catch((error) => {
    console.log('[Kroger Clipper] No saved filters, using defaults:', error);
  });

  // Save filter preferences when changed
  FILTER_CATEGORIES.forEach(category => {
    const checkbox = document.getElementById(category);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        const filters = {};
        FILTER_CATEGORIES.forEach(cat => {
          const cb = document.getElementById(cat);
          if (cb) filters[cat] = cb.checked;
        });
        extensionAPI.storage.sync.set({ couponFilters: filters });
      });
    }
  });

  // Close button handler
  closeBtn.addEventListener("click", () => {
    stopClipping();
    window.close();
  });

  yesBtn.addEventListener("click", async () => {
    // Collect current filter settings
    const filters = {};
    FILTER_CATEGORIES.forEach(category => {
      const checkbox = document.getElementById(category);
      if (checkbox) {
        filters[category] = checkbox.checked;
      }
    });

    isClipping = true;
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
    toggleFiltersBtn.style.display = "none";
    filtersSection.style.display = "none";
    progress.style.display = "block";
    progress.textContent = "Clipping in progress...";

    // Clear the stop flag in storage
    extensionAPI.storage.local.set({ clipperShouldStop: false });

    extensionAPI.tabs.sendMessage(currentTab.id, {
      type: "start-clipping",
      filters: filters
    });
  });

  extensionAPI.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      progress.textContent = `Clipping... ${msg.clipped} / ${msg.total}`;
    } else if (msg.type === "done") {
      isClipping = false;
      progress.textContent = "All coupons clipped!";
    } else if (msg.type === "limit-reached") {
      isClipping = false;
      progress.textContent = "250 coupon limit reached.";
    }
  });

  noBtn.addEventListener("click", () => window.close());
});
