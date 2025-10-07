// This is a *static* page that never redirects and is safe to precache.
// Next will boot the real app for the current URL from cached JS chunks.
export const dynamic = "force-static";

export default function OfflineShell() {
  return (
    <html lang="el">
      <body>
        <div id="__next">
          <main
            style={{
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
            }}
          >
            <p>Φόρτωση εφαρμογής εκτός σύνδεσης…</p>
          </main>
        </div>
      </body>
    </html>
  );
}
