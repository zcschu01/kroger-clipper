// Firefox/Chrome compatibility wrapper
const extensionAPI = (() => {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  // Fallback - try window scope
  return window.browser || window.chrome;
})();

// Categories excluded by default
const EXCLUDED_BY_DEFAULT = ['Adult Beverage', 'Tobacco'];

// Build filter UI dynamically from discovered categories
async function buildFilterUI(filtersContainer) {
  const data = await extensionAPI.storage.local.get(['availableCategories']);

  if (!data.availableCategories || data.availableCategories.length === 0) {
    filtersContainer.innerHTML = '<p>Loading categories... Please refresh the Kroger page.</p>';
    return;
  }

  const categories = data.availableCategories;

  // Sort categories: excluded last, rest alphabetically
  const sorted = categories.sort((a, b) => {
    const aExcluded = EXCLUDED_BY_DEFAULT.includes(a);
    const bExcluded = EXCLUDED_BY_DEFAULT.includes(b);

    if (aExcluded && !bExcluded) return 1;
    if (!aExcluded && bExcluded) return -1;
    return a.localeCompare(b);
  });

  // Build sections
  const enabled = sorted.filter(c => !EXCLUDED_BY_DEFAULT.includes(c));
  const excluded = sorted.filter(c => EXCLUDED_BY_DEFAULT.includes(c));

  let html = '<h3>Filter Categories</h3>';

  if (enabled.length > 0) {
    html += '<div class="section-header">Enabled by Default</div>';
    enabled.forEach(category => {
      const id = category.replace(/[^a-zA-Z0-9]/g, '-');
      html += `
        <div class="filter-category">
          <input type="checkbox" id="${id}" data-category="${category}" checked>
          <label for="${id}">${category}</label>
        </div>
      `;
    });
  }

  if (excluded.length > 0) {
    html += '<div class="section-header">Excluded by Default</div>';
    excluded.forEach(category => {
      const id = category.replace(/[^a-zA-Z0-9]/g, '-');
      html += `
        <div class="filter-category">
          <input type="checkbox" id="${id}" data-category="${category}">
          <label for="${id}">${category}</label>
        </div>
      `;
    });
  }

  filtersContainer.innerHTML = html;

  return categories;
}

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

  // Build filter UI dynamically
  const categories = await buildFilterUI(filtersSection);

  // Load saved filter preferences if they exist
  if (categories) {
    const saved = await extensionAPI.storage.sync.get('couponFilters');
    if (saved && saved.couponFilters) {
      // Apply saved preferences to checkboxes
      categories.forEach(category => {
        const id = category.replace(/[^a-zA-Z0-9]/g, '-');
        const checkbox = document.getElementById(id);
        if (checkbox && saved.couponFilters[category] !== undefined) {
          checkbox.checked = saved.couponFilters[category];
        }
      });
    }

    // Add change listeners to all checkboxes
    categories.forEach(category => {
      const id = category.replace(/[^a-zA-Z0-9]/g, '-');
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          // Save all filter states
          const filters = {};
          categories.forEach(cat => {
            const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
            const cb = document.getElementById(catId);
            if (cb) filters[cat] = cb.checked;
          });
          extensionAPI.storage.sync.set({ couponFilters: filters });
        });
      }
    });
  }

  // Toggle filters visibility
  let filtersVisible = false;
  toggleFiltersBtn.addEventListener("click", () => {
    filtersVisible = !filtersVisible;
    filtersSection.style.display = filtersVisible ? 'block' : 'none';
    toggleFiltersBtn.textContent = filtersVisible ? 'Hide Filters' : 'Show Filters';
  });

  // Close button handler
  closeBtn.addEventListener("click", () => {
    stopClipping();
    window.close();
  });

  yesBtn.addEventListener("click", async () => {
    // Collect current filter settings from dynamic checkboxes
    const filters = {};
    if (categories) {
      categories.forEach(category => {
        const id = category.replace(/[^a-zA-Z0-9]/g, '-');
        const checkbox = document.getElementById(id);
        if (checkbox) {
          filters[category] = checkbox.checked;
        }
      });
    }

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
      const count = msg.totalClipped || 0;
      progress.textContent = `All coupons clipped! (${count} total)`;
    } else if (msg.type === "limit-reached") {
      isClipping = false;
      const count = msg.totalClipped || 250;
      progress.textContent = `250 coupon limit reached. (${count} clipped)`;
    }
  });

  noBtn.addEventListener("click", () => window.close());
});
