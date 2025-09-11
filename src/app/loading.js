"use client";

export default function Loading() {
  return (
    <main
      className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#faf8f3]/75 via-[#efebe4]/65 to-[#e6e2db]/75 backdrop-blur-md cursor-wait"
      role="status"
      aria-label="Γίνεται φόρτωση"
      aria-live="polite"
    >
      {/* Glass card */}
      <div className="relative rounded-2xl border border-[#e7e1d6] bg-white/70 backdrop-blur-xl shadow-lg px-6 py-5">
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div className="relative h-8 w-8" aria-hidden="true">
            <div className="absolute inset-0 rounded-full border-2 border-[#d9d3c7]" />
            <div className="spinner-slice absolute inset-0 rounded-full border-2 border-transparent border-t-[#8c7c68]" />
          </div>

          {/* Text + animated dots */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tracking-wide text-[#3b3a36]">
              Φόρτωση
            </span>
            <span className="dots flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-[#8c7c68] opacity-80" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#8c7c68] opacity-80" />
              <i className="h-1.5 w-1.5 rounded-full bg-[#8c7c68] opacity-80" />
            </span>
          </div>
        </div>

        {/* soft highlight */}
        <div className="pointer-events-none absolute -top-8 -right-10 h-24 w-24 rounded-full bg-[radial-gradient(ellipse_at_center,_#f4f0e9_20%,_transparent_60%)] opacity-50" />
      </div>

      <style jsx>{`
        /* spinner */
        .spinner-slice {
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* dots */
        .dots i {
          animation: bounce 1.2s ease-in-out infinite;
        }
        .dots i:nth-child(2) {
          animation-delay: 0.12s;
        }
        .dots i:nth-child(3) {
          animation-delay: 0.24s;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .spinner-slice,
          .dots i {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
