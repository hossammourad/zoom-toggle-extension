const input = document.getElementById("zoom");
const status = document.getElementById("status");

chrome.storage.sync.get("zoomLevel", ({ zoomLevel = 1.1 }) => {
  input.value = Math.round(zoomLevel * 100);
});

chrome.commands.getAll((commands) => {
  const cmd = commands.find((c) => c.name === "_execute_action");
  const display = document.getElementById("shortcut-display");
  if (cmd?.shortcut) {
    display.innerHTML = cmd.shortcut
      .split("+")
      .map((k) => `<kbd>${k}</kbd>`)
      .join(" + ");
  } else {
    display.textContent = "–";
  }
});

document.getElementById("shortcut-link").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

document.getElementById("save").addEventListener("click", () => {
  const pct = parseInt(input.value, 10);
  if (isNaN(pct) || pct < 50 || pct > 500) {
    status.style.color = "#c5221f";
    status.textContent = "Enter a value between 50 and 500.";
    return;
  }
  chrome.storage.sync.set({ zoomLevel: pct / 100 }, () => {
    status.style.color = "#188038";
    status.textContent = "Saved!";
    setTimeout(() => (status.textContent = ""), 2000);
  });
});
