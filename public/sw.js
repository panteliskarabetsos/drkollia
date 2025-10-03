/* eslint-disable no-undef */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("admin-pages")
      .then((cache) =>
        cache.addAll([
          "/admin",
          "/admin/appointments",
          "/admin/patients",
          "/admin/schedule",
        ])
      )
  );
});
