/* Runs before first paint so the saved theme never flashes. Kept tiny and dependency-free. */
(function () {
  var THEMES = ['soothing', 'light', 'dark'];
  var COLORS = { soothing: '#ede8dd', light: '#f5f2eb', dark: '#051424' };
  var theme = 'soothing';
  try {
    var saved = JSON.parse(window.localStorage.getItem('bn_theme_v1'));
    if (THEMES.indexOf(saved) !== -1) theme = saved;
  } catch {
    /* storage unavailable – use default */
  }
  document.documentElement.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COLORS[theme]);
})();
