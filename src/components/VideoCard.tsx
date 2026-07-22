// Видео-визитка: mp4/webm показываем плеером, YouTube/Vimeo — встраиваем.
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default function VideoCard({ url }: { url: string }) {
  if (!url) return null;
  const yt = youtubeId(url);

  return (
    <div style={{ borderRadius: "var(--radius)", overflow: "hidden", background: "#000", aspectRatio: "16 / 9" }}>
      {yt ? (
        <iframe
          src={`https://www.youtube.com/embed/${yt}`}
          title="Видео-визитка"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      ) : (
        <video src={url} controls preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      )}
    </div>
  );
}
