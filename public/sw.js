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
      f = { module: { uri: i }, exports: t, require: r };
    a[i] = Promise.all(c.map((e) => f[e] || r(e))).then((e) => (n(...e), t));
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
          url: "/_next/static/chunks/1916-21fe9b71bced61fa.js",
          revision: "21fe9b71bced61fa",
        },
        {
          url: "/_next/static/chunks/2170a4aa-fcb12ace29bc7815.js",
          revision: "fcb12ace29bc7815",
        },
        {
          url: "/_next/static/chunks/2287-78dd76d357e64f67.js",
          revision: "78dd76d357e64f67",
        },
        {
          url: "/_next/static/chunks/247-c93fd1290945a726.js",
          revision: "c93fd1290945a726",
        },
        {
          url: "/_next/static/chunks/2858-ff5bc19d300c96a2.js",
          revision: "ff5bc19d300c96a2",
        },
        {
          url: "/_next/static/chunks/3008-34bf02fae8a9038d.js",
          revision: "34bf02fae8a9038d",
        },
        {
          url: "/_next/static/chunks/3072-918f022b6bee0841.js",
          revision: "918f022b6bee0841",
        },
        {
          url: "/_next/static/chunks/3368-a7a6c41bbb0b248e.js",
          revision: "a7a6c41bbb0b248e",
        },
        {
          url: "/_next/static/chunks/3381-40b5d4c360686b71.js",
          revision: "40b5d4c360686b71",
        },
        {
          url: "/_next/static/chunks/3825-97a5ed2fa7d4f12a.js",
          revision: "97a5ed2fa7d4f12a",
        },
        {
          url: "/_next/static/chunks/3939-ec27f22b91602d60.js",
          revision: "ec27f22b91602d60",
        },
        {
          url: "/_next/static/chunks/4171-ab70a92f1377e435.js",
          revision: "ab70a92f1377e435",
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
          url: "/_next/static/chunks/5244.a12b5b7fc410c70c.js",
          revision: "a12b5b7fc410c70c",
        },
        {
          url: "/_next/static/chunks/5359-5b0358223249d829.js",
          revision: "5b0358223249d829",
        },
        {
          url: "/_next/static/chunks/5881-bdb1c4f79aef3edc.js",
          revision: "bdb1c4f79aef3edc",
        },
        {
          url: "/_next/static/chunks/6671-24139d96056a6e31.js",
          revision: "24139d96056a6e31",
        },
        {
          url: "/_next/static/chunks/6766-294b23edd7c7eb7f.js",
          revision: "294b23edd7c7eb7f",
        },
        {
          url: "/_next/static/chunks/7005.7aad64ac44abbdec.js",
          revision: "7aad64ac44abbdec",
        },
        {
          url: "/_next/static/chunks/7236-841f5949856009bf.js",
          revision: "841f5949856009bf",
        },
        {
          url: "/_next/static/chunks/7824-a8d8271ba2b37e38.js",
          revision: "a8d8271ba2b37e38",
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
          url: "/_next/static/chunks/9352-9c30f4238985aef1.js",
          revision: "9c30f4238985aef1",
        },
        {
          url: "/_next/static/chunks/95-fbbb854827f813b3.js",
          revision: "fbbb854827f813b3",
        },
        {
          url: "/_next/static/chunks/986-d850faf70894ef78.js",
          revision: "d850faf70894ef78",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/about/page-30ea710408a7cd7b.js",
          revision: "30ea710408a7cd7b",
        },
        {
          url: "/_next/static/chunks/app/admin/accounts/page-4b6285a25cde8169.js",
          revision: "4b6285a25cde8169",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/exception/page-58360b13a8253f05.js",
          revision: "58360b13a8253f05",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/new/page-e26f21ee181e72f2.js",
          revision: "e26f21ee181e72f2",
        },
        {
          url: "/_next/static/chunks/app/admin/appointments/page-6ea1a7dc3ced9246.js",
          revision: "6ea1a7dc3ced9246",
        },
        {
          url: "/_next/static/chunks/app/admin/help/page-44152411a410cec6.js",
          revision: "44152411a410cec6",
        },
        {
          url: "/_next/static/chunks/app/admin/layout-507d017a6945b84f.js",
          revision: "507d017a6945b84f",
        },
        {
          url: "/_next/static/chunks/app/admin/loading-c1ed17934aa1caf9.js",
          revision: "c1ed17934aa1caf9",
        },
        {
          url: "/_next/static/chunks/app/admin/page-6a6ddd843920c8d9.js",
          revision: "6a6ddd843920c8d9",
        },
        {
          url: "/_next/static/chunks/app/admin/past-appointments/page-8680e1b4aac46e82.js",
          revision: "8680e1b4aac46e82",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/%5Bid%5D/page-02396d33ff9a0bf7.js",
          revision: "02396d33ff9a0bf7",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/history/%5Bid%5D/page-9d9a09bb6edd4b66.js",
          revision: "9d9a09bb6edd4b66",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/new/page-470e0069e8fc2b81.js",
          revision: "470e0069e8fc2b81",
        },
        {
          url: "/_next/static/chunks/app/admin/patients/page-7c791cb1609aac5e.js",
          revision: "7c791cb1609aac5e",
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
          url: "/_next/static/chunks/app/admin/schedule/page-e5741e41b2c42ecd.js",
          revision: "e5741e41b2c42ecd",
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
          url: "/_next/static/chunks/app/appointments/page-cff34495d9aae3fc.js",
          revision: "cff34495d9aae3fc",
        },
        {
          url: "/_next/static/chunks/app/appointments/success/page-4681a5a443469766.js",
          revision: "4681a5a443469766",
        },
        {
          url: "/_next/static/chunks/app/contact/page-7650cb17c1794257.js",
          revision: "7650cb17c1794257",
        },
        {
          url: "/_next/static/chunks/app/error-fd1f4ab2d32a51c9.js",
          revision: "fd1f4ab2d32a51c9",
        },
        {
          url: "/_next/static/chunks/app/iatreio/page-35121cee330cc4e3.js",
          revision: "35121cee330cc4e3",
        },
        {
          url: "/_next/static/chunks/app/layout-6aef1f900f221c2a.js",
          revision: "6aef1f900f221c2a",
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
          url: "/_next/static/chunks/app/login/page-ebc3ec03e4119eaf.js",
          revision: "ebc3ec03e4119eaf",
        },
        {
          url: "/_next/static/chunks/app/not-found-8add5312c34ef983.js",
          revision: "8add5312c34ef983",
        },
        {
          url: "/_next/static/chunks/app/page-ffb421f8f52fe487.js",
          revision: "ffb421f8f52fe487",
        },
        {
          url: "/_next/static/chunks/app/privacy-policy/page-e538b443fe8961f4.js",
          revision: "e538b443fe8961f4",
        },
        {
          url: "/_next/static/chunks/app/signup/page-8204579594d31206.js",
          revision: "8204579594d31206",
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
          url: "/_next/static/chunks/webpack-a98f2b72cec7a269.js",
          revision: "a98f2b72cec7a269",
        },
        {
          url: "/_next/static/css/094c308365445f8e.css",
          revision: "094c308365445f8e",
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
          url: "/_next/static/css/c356e07e7ecda0ff.css",
          revision: "c356e07e7ecda0ff",
        },
        {
          url: "/_next/static/igJaL5M_Cz-jNE-qr_-60/_buildManifest.js",
          revision: "0f66c58c97c97021ca0625db03446933",
        },
        {
          url: "/_next/static/igJaL5M_Cz-jNE-qr_-60/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
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
        {
          url: "/background.mp4",
          revision: "81be5dec67e278a5b0ff5ec2a8e17888",
        },
        {
          url: "/banner-about.jpg",
          revision: "23dff74aff8df5ce1d76ce3e11ec613a",
        },
        {
          url: "/clinic-interior.jpg",
          revision: "e844b3d8c193cb2bceb1df0e95a6348c",
        },
        {
          url: "/contact-banner.jpg",
          revision: "e880a73a80d55a17a746cd3a78050988",
        },
        {
          url: "/contact-banner1.jpg",
          revision: "edd7d8eeb14640a270addb552fd84307",
        },
        {
          url: "/contact-banner2.jpg",
          revision: "c6ff524b1ed6e4b05a5a7f315a7f91da",
        },
        { url: "/cta.jpg", revision: "63f89299443e967cff677d094f221c5d" },
        { url: "/doctor.jpg", revision: "3a95076337cbbe392863f0f0541d2e1d" },
        {
          url: "/endocrinology.jpg",
          revision: "7b71370d0a9f22f40679987ed23fb9dc",
        },
        {
          url: "/fallback-ce627215c0e4a9af.js",
          revision: "78a860a830d27bb7927dc1d40e569215",
        },
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
        {
          url: "/iatreio-banner.png",
          revision: "26e00fd30bea4c835d46d432195043e4",
        },
        { url: "/iatreio.jpg", revision: "bb1d8c95711b1aa0f77f51f9f75616c5" },
        { url: "/iatreio1.jpg", revision: "4267976e5a03c061d5a3367be85ecf72" },
        { url: "/iatreio2.jpg", revision: "62a9332ad6141c43354f688107b03b05" },
        { url: "/iatreio3.jpg", revision: "bb1d8c95711b1aa0f77f51f9f75616c5" },
        { url: "/iatreio4.jpg", revision: "e073f7b3ccd98a4bd73cd880acf76883" },
        { url: "/manifest.json", revision: "f9bcdd75cbc3e795dd1744b56e5ab3e8" },
        { url: "/offline.html", revision: "5761648f62008d6c3bd1bf8712e0e6f0" },
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
