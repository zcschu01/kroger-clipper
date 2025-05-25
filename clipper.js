chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "start-clipping") {
    runClippingWorkflow();
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
  const buttons = Array.from(
    document.querySelectorAll("button.CouponCard-button")
  ).filter(
    (btn) =>
      btn.textContent.trim() === "Clip" && !btn.disabled && !btn.dataset.clipped
  );

  let clippedThisSession = 0;

  for (const btn of buttons) {
    if (totalClipped >= 250) {
      console.warn("250 coupon limit reached — stopping.");
      try {
        chrome.runtime.sendMessage({ type: "limit-reached" });
      } catch {}
      return true;
    }

    btn.click();
    btn.dataset.clipped = "true";

    // Wait for the DOM to reflect change
    await new Promise((r) => setTimeout(r, 300));
    const newText = btn.textContent.trim();

    if (newText === "Unclip") {
      totalClipped++;
      clippedThisSession++;
      try {
        chrome.runtime.sendMessage({
          type: "progress",
          clipped: totalClipped,
          total: totalExpected,
        });
      } catch {}
    } else {
      // Clip didn't take — assume 250 limit reached
      console.warn("Clip failed — limit likely reached.");
      try {
        chrome.runtime.sendMessage({ type: "limit-reached" });
      } catch {}
      return true;
    }
  }

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
      chrome.runtime.sendMessage({ type: "done" });
    } catch {}
  }
}