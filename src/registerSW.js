// Forces the app to reload once when a new service worker takes control,
// so you always see the latest version without manually clearing cache.
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
