const DEFAULT_ZOOM = 1.0;

// Persist state so service worker restarts don't lose it
async function getState() {
  const { isZoomed = false } = await chrome.storage.local.get("isZoomed");
  return isZoomed;
}

async function setState(isZoomed) {
  await chrome.storage.local.set({ isZoomed });
}

async function getZoomLevel() {
  const { zoomLevel = 1.1 } = await chrome.storage.sync.get("zoomLevel");
  return zoomLevel;
}

async function applyZoomToAllTabs(zoomFactor) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) =>
      chrome.tabs.setZoom(tab.id, zoomFactor).catch(() => {})
    )
  );
}

async function refreshAllIcons(isZoomed, zoomLevel) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => drawIcon(tab.id, isZoomed, zoomLevel));
}

// Toggle on icon click
chrome.action.onClicked.addListener(async () => {
  const isZoomed = await getState();
  const zoomLevel = await getZoomLevel();

  if (isZoomed) {
    await applyZoomToAllTabs(DEFAULT_ZOOM);
    await setState(false);
    await refreshAllIcons(false, zoomLevel);
  } else {
    await applyZoomToAllTabs(zoomLevel);
    await setState(true);
    await refreshAllIcons(true, zoomLevel);
  }
});

// Apply zoom to newly opened tabs automatically
chrome.tabs.onCreated.addListener(async (tab) => {
  const isZoomed = await getState();
  if (!isZoomed) return;
  const zoomLevel = await getZoomLevel();
  // Wait briefly for the tab to be ready before setting zoom
  setTimeout(() => {
    chrome.tabs.setZoom(tab.id, zoomLevel).catch(() => {});
    drawIcon(tab.id, true, zoomLevel);
  }, 500);
});

// Keep icon in sync when switching tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const isZoomed = await getState();
  const zoomLevel = await getZoomLevel();
  drawIcon(tabId, isZoomed, zoomLevel);
});

function drawIcon(tabId, isZoomed, zoomLevel) {
  const size = 16;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#5f6368";
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Z", size / 2, size / 2 + 1);

  const imageData = ctx.getImageData(0, 0, size, size);
  chrome.action.setIcon({ tabId, imageData });

  const pct = Math.round(zoomLevel * 100);
  chrome.action.setTitle({
    tabId,
    title: isZoomed
      ? `Zoom Toggle — all tabs at ${pct}% (click to reset)`
      : `Zoom Toggle — click to zoom all tabs to ${pct}%`,
  });
}
