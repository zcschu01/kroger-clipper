document.addEventListener("DOMContentLoaded", () => {
  const yesBtn = document.getElementById("yes");
  const noBtn = document.getElementById("no");
  const progress = document.getElementById("progress");

  yesBtn.addEventListener("click", async () => {
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
    progress.style.display = "block";
    progress.textContent = "Clipping in progress...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id, { type: "start-clipping" });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "progress") {
      progress.textContent = `Clipping... ${msg.clipped} / ${msg.total}`;
    } else if (msg.type === "done") {
      progress.textContent = "All coupons clipped!";
      setTimeout(() => window.close(), 2000);
    } else if (msg.type === "limit-reached") {
      progress.textContent = "250 coupon limit reached.";
      setTimeout(() => window.close(), 3000);
    }
  });

  noBtn.addEventListener("click", () => window.close());
});
