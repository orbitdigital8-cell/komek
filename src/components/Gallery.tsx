"use client";

import { useState } from "react";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (images.length === 0) return null;

  return (
    <div>
      <div
        onClick={() => setLightbox(true)}
        style={{ position: "relative", aspectRatio: "16 / 10", borderRadius: "var(--radius)", overflow: "hidden", cursor: "zoom-in", background: "var(--surface-2)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {images.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 72,
                height: 54,
                borderRadius: 10,
                overflow: "hidden",
                border: i === active ? "2px solid var(--brand)" : "2px solid transparent",
                padding: 0,
                cursor: "pointer",
                background: "var(--surface-2)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,8,20,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[active]} alt={name} style={{ maxWidth: "92vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
