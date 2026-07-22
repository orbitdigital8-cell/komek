export default function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  if (!rating) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: size, fontWeight: 700 }}>
      <span className="star">★</span>
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}
