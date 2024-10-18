define(["jquery"], function($) {
  if (typeof jQuery === 'function') {
    console.log("Using existing jQuery...");
    return jQuery;
  }
});