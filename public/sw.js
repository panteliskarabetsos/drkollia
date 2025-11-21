if (!self.define) {
  let e,
    a = {};
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    a[s] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = s), (e.onload = a), document.head.appendChild(e);
        } else (e = s), importScripts(s), a();
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, n) => {
    const i =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[i]) return;
    let t = {};
    const r = (e) => s(e, i),
      d = { module: { uri: i }, exports: t, require: r };
    a[i] = Promise.all(c.map((e) => d[e] || r(e))).then((e) => (n(...e), t));
  };
}
define(["./workbox-f1770938"], function (e) {
  "use strict";
  importScripts("/fallback-ce627215c0e4a9af.js"),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/Z3JG-IId9bnQMlRlGppxp/_buildManifest.js",
          revision: "35dca18a4f7fd28fd82b766bee5c2c55",
        },
        {
          url: "/_next/static/Z3JG-IId9bnQMlRlGppxp/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1621-10eaaecee8c90389.js",
          revision: "10eaaecee8c90389",
        },
        {
          url: "/_next/static/chunks/2170a4aa-fcb12ace29bc7815.js",
          revision: "fcb12ace29bc7815",
        },
        {
          url: "/_next/static/chunks/2858-b798e6234596219c.js",
          revision: "b798e6234596219c",
        },
        {
          url: "/_next/static/chunks/2898-25f553e6f87c92b6.js",
          revision: "25f553e6f87c92b6",
        },
        {
          url: "/_next/static/chunks/2984-135022cbd1cc6034.js",
          revision: "135022cbd1cc6034",
        },
        {
          url: "/_next/static/chunks/3008-34bf02fae8a9038d.js",
          revision: "34bf02fae8a9038d",
        },
        {
          url: "/_next/static/chunks/3230-7b6da4e28085fdb9.js",
          revision: "7b6da4e28085fdb9",
        },
        {
          url: "/_next/static/chunks/3386-6344d1a0fa75bc1d.js",
          revision: "6344d1a0fa75bc1d",
        },
        {
          url: "/_next/static/chunks/3455-0eebe01c1def3f3d.js",
          revision: "0eebe01c1def3f3d",
        },
        {
          url: "/_next/static/chunks/3460-185b11a1c003a652.js",
          revision: "185b11a1c003a652",
        },
        {
          url: "/_next/static/chunks/3825-97a5ed2fa7d4f12a.js",
          revision: "97a5ed2fa7d4f12a",
        },
        {
          url: "/_next/static/chunks/4171-ab70a92f1377e435.js",
          revision: "ab70a92f1377e435",
        },
        {
          url: "/_next/static/chunks/4245-1c06be76af244d4c.js",
          revision: "1c06be76af244d4c",
        },
        {
          url: "/_next/static/chunks/4272-b751f2e7e7a7591e.js",
          revision: "b751f2e7e7a7591e",
        },
        {
          url: "/_next/static/chunks/4bd1b696-cc729d47eba2cee4.js",
          revision: "cc729d47eba2cee4",
        },
        {
          url: "/_next/static/chunks/5-090f9c3dd89e87c1.js",
          revision: "090f9c3dd89e87c1",
        },
        {
          url: "/_next/static/chunks/508-53b846efdbf332c9.js",
          revision: "53b846efdbf332c9",
        },
        {
          url: "/_next/static/chunks/5123-43a2bb512a0f63a8.js",
          revision: "43a2bb512a0f63a8",
        },
        {
          url: "/_next/static/chunks/5244.861a1646b982c90b.js",
          revision: "861a1646b982c90b",
        },
        {
          url: "/_next/static/chunks/5359-c51ec3405aa44074.js",
          revision: "c51ec3405aa44074",
        },
        {
          url: "/_next/static/chunks/5817-35e006c966bcc584.js",
          revision: "35e006c966bcc584",
        },
        {
          url: "/_next/static/chunks/5881-bdb1c4f79aef3edc.js",
          revision: "bdb1c4f79aef3edc",
        },
        {
          url: "/_next/static/chunks/5996-bb468d7231428766.js",
          revision: "bb468d7231428766",
        },
        {
          url: "/_next/static/chunks/638-1b4d498598303ebf.js",
          revision: "1b4d498598303ebf",
        },
        {
          url: "/_next/static/chunks/651-862454b48aafe8ca.js",
          revision: "862454b48aafe8ca",
        },
        {
          url: "/_next/static/chunks/6540-4072adf07b968713.js",
          revision: "4072adf07b968713",
        },
        {
          url: "/_next/static/chunks/6671-24139d96056a6e31.js",
          revision: "24139d96056a6e31",
        },
        {
          url: "/_next/static/chunks/6874-414075bb21e16c80.js",
          revision: "414075bb21e16c80",
        },
        {
          url: "/_next/static/chunks/7005.7aad64ac44abbdec.js",
          revision: "7aad64ac44abbdec",
        },
        {
          url: "/_next/static/chunks/7236-f4483dc1c115aa0d.js",
          revision: "f4483dc1c115aa0d",
        },
        {
          url: "/_next/static/chunks/7935-1a8806f06f8923bf.js",
          revision: "1a8806f06f8923bf",
        },
        {
          url: "/_next/static/chunks/8436.cab94b59cca0a8ff.js",
          revision: "cab94b59cca0a8ff",
        },
        {
          url: "/_next/static/chunks/8698-a540a36f24e97302.js",
          revision: "a540a36f24e97302",
        },
        {
          url: "/_next/static/chunks/8795-3f27eae128e038e8.js",
          revision: "3f27eae128e038e8",
        },
        {
          url: "/_next/static/chunks/8e1d74a4-7e9608484608714b.js",
          revision: "7e9608484608714b",
        },
        {
          url: "/_next/static/chunks/9920-42d7fab4532ba5ec.js",
          revision: "42d7fab4532ba5ec",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/about/page-bbc12f963e7ace08.js",
          revision: "bbc12f963e7ace08",
        },
        {
          url: "/_next/static/chunks/app/admin/accounts/page-acc7298d89b186a8.js",
          revision: "acc7298d89b186a8",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/exception/page-fd9174d27598a630.js",
          revision: "fd9174d27598a630",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/new/page-ebee4d6debb9345b.js",
          revision: "ebee4d6debb9345b",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/page-f629329596117ed6.js",
          revision: "f629329596117ed6",
        },
        {
          url: "/_next/static/chunks/app/admin/help/page-44152411a410cec6.js",
          revision: "44152411a410cec6",
        },
        {
          url: "/_next/static/chunks/app/admin/layout-750faca32338ab25.js",
          revision: "750faca32338ab25",
        },
        {
          url: "/_next/static/chunks/app/admin/loading-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/admin/offline-shell/page-29eab5891ef01373.js",
          revision: "29eab5891ef01373",
        },
        {
          url: "/_next/static/chunks/app/admin/page-f0a293642a85f7ec.js",
          revision: "f0a293642a85f7ec",
        },
        {
          url: "/_next/static/chunks/app/admin/past-appointments/page-8680e1b4aac46e82.js",
          revision: "8680e1b4aac46e82",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/%5Bid%5D/page-de5f3827c28e10b6.js",
          revision: "de5f3827c28e10b6",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/history/%5Bid%5D/page-5113ba529373aa62.js",
          revision: "5113ba529373aa62",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/new/page-ffcdf6088ce7b836.js",
          revision: "ffcdf6088ce7b836",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/page-573bca79ef99999f.js",
          revision: "573bca79ef99999f",
        },
        {
          url: "/_next/static/chunks/app/admin/report-incident/page-ad693c72e349d349.js",
          revision: "ad693c72e349d349",
        },
        {
          url: "/_next/static/chunks/app/admin/reports/page-2edd4d6fa116d22f.js",
          revision: "2edd4d6fa116d22f",
        },
        {
          url: "/_next/static/chunks/app/admin/schedule/page-92511fa433541f22.js",
          revision: "92511fa433541f22",
        },
        {
          url: "/_next/static/chunks/app/admin/settings/page-d625ba6df54c636d.js",
          revision: "d625ba6df54c636d",
        },
        {
          url: "/_next/static/chunks/app/api/appointments/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/check-availability/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/create-user/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/cron-cleanup/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/cron/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/delete-user/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/health/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/incident-email/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/login/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/mark-completed/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/notify-incident/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/patients/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/send-cancellation/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/send-confirmation/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/send-reminder/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/verify-recaptcha/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/api/visitors/route-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/appointments/page-dc037173b31c11be.js",
          revision: "dc037173b31c11be",
        },
        {
          url: "/_next/static/chunks/app/appointments/success/page-eb48d985e4ce34f2.js",
          revision: "eb48d985e4ce34f2",
        },
        {
          url: "/_next/static/chunks/app/contact/page-27d211c28f29d949.js",
          revision: "27d211c28f29d949",
        },
        {
          url: "/_next/static/chunks/app/error-f61fdc9f8f146a6d.js",
          revision: "f61fdc9f8f146a6d",
        },
        {
          url: "/_next/static/chunks/app/iatreio/page-8e8e1919e161c957.js",
          revision: "8e8e1919e161c957",
        },
        {
          url: "/_next/static/chunks/app/layout-6ef460432b3653c3.js",
          revision: "6ef460432b3653c3",
        },
        {
          url: "/_next/static/chunks/app/legal/page-72b14a06ad4eab1a.js",
          revision: "72b14a06ad4eab1a",
        },
        {
          url: "/_next/static/chunks/app/loading-6e56d5e97479a56c.js",
          revision: "6e56d5e97479a56c",
        },
        {
          url: "/_next/static/chunks/app/login/page-8bf3db3652f43c7d.js",
          revision: "8bf3db3652f43c7d",
        },
        {
          url: "/_next/static/chunks/app/not-found-3cc513317fa1026d.js",
          revision: "3cc513317fa1026d",
        },
        {
          url: "/_next/static/chunks/app/page-1d8fe824b894e67d.js",
          revision: "1d8fe824b894e67d",
        },
        {
          url: "/_next/static/chunks/app/privacy-policy/page-e538b443fe8961f4.js",
          revision: "e538b443fe8961f4",
        },
        {
          url: "/_next/static/chunks/app/signup/page-4b4b924d1cd3098b.js",
          revision: "4b4b924d1cd3098b",
        },
        {
          url: "/_next/static/chunks/app/terms/page-6c2ce7f968f97fce.js",
          revision: "6c2ce7f968f97fce",
        },
        {
          url: "/_next/static/chunks/framework-6a579fe8df05a747.js",
          revision: "6a579fe8df05a747",
        },
        {
          url: "/_next/static/chunks/main-7bc41687dc3f2d93.js",
          revision: "7bc41687dc3f2d93",
        },
        {
          url: "/_next/static/chunks/main-app-9bcbabf9d9920e4c.js",
          revision: "9bcbabf9d9920e4c",
        },
        {
          url: "/_next/static/chunks/pages/_app-1af4163d4f10b6fc.js",
          revision: "1af4163d4f10b6fc",
        },
        {
          url: "/_next/static/chunks/pages/_error-43885327f020d18a.js",
          revision: "43885327f020d18a",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-dc75dc75a72112ff.js",
          revision: "dc75dc75a72112ff",
        },
        {
          url: "/_next/static/css/094c308365445f8e.css",
          revision: "094c308365445f8e",
        },
        {
          url: "/_next/static/css/1794cad9cc0ce2e8.css",
          revision: "1794cad9cc0ce2e8",
        },
        {
          url: "/_next/static/css/21f7ff34aa29c233.css",
          revision: "21f7ff34aa29c233",
        },
        {
          url: "/_next/static/css/57a46301f0aa7b9e.css",
          revision: "57a46301f0aa7b9e",
        },
        {
          url: "/_next/static/css/a8cf6256a3c83335.css",
          revision: "a8cf6256a3c83335",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/30d74baa196fe88a-s.p.woff2",
          revision: "ea5d1d6ec3ac0830811e2b8d98d09077",
        },
        {
          url: "/_next/static/media/3ba05cde04a1b013-s.woff2",
          revision: "19d2bffe3c79670b9e3cb7afca4a0350",
        },
        {
          url: "/_next/static/media/435d7d3c1b2ff02f-s.woff2",
          revision: "d860f0cddb55e84fd912b9de3b8ed2dc",
        },
        {
          url: "/_next/static/media/7b800e61c24d781c-s.woff2",
          revision: "79fac5454255851d25ea2a454e6e7b28",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba6607e4cc7979de-s.woff2",
          revision: "128d7b9d811c75ee37fd743a38b614a3",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/d4548b25969cca89-s.woff2",
          revision: "7f2965a12e25430d126961b7de37aa98",
        },
        {
          url: "/_next/static/media/dcd0d8c94b74be53-s.woff2",
          revision: "b056433303b46910e775fad461b88c6d",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/_next/static/media/f1c328b8a9761933-s.woff2",
          revision: "9190b2b06f547b305c59f63f9f6197d9",
        },
        { url: "/admin/appointments", revision: "1" },
        { url: "/admin/appointments/new", revision: "1" },
        { url: "/admin/offline-shell", revision: "1" },
        { url: "/admin/patients", revision: "1" },
        { url: "/admin/patients/new", revision: "1" },
        {
          url: "/fallback-ce627215c0e4a9af.js",
          revision: "36934817e3f455104fed6b1fbe8524ef",
        },
        { url: "/login", revision: "1" },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: a } }) =>
        !(!e || a.startsWith("/api/auth/callback") || !a.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: s }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        s &&
        !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: s }) =>
        "1" === e.headers.get("RSC") && s && !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: a }) => a && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
          {
            handlerDidError: async ({ request: e }) =>
              "undefined" != typeof self ? self.fallback(e) : Response.error(),
          },
        ],
      }),
      "GET"
    );
});
