export default function SkeletonCard() {
  return (
    <div
      className="flex flex-col border"
      style={{ borderColor: "var(--border)", backgroundColor: "#0f0e0c" }}
    >
      {/* Image area */}
      <div className="w-full aspect-[3/4] shimmer" />

      {/* Color swatch strip */}
      <div className="h-1 shimmer" />

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Type label */}
        <div className="h-2 w-16 shimmer" />

        {/* Title */}
        <div className="h-5 w-3/4 shimmer" />

        {/* Subtitle */}
        <div className="h-3.5 w-1/2 shimmer" />

        {/* Material tags */}
        <div className="flex gap-1 pt-0.5">
          <div className="h-4 w-10 shimmer" />
          <div className="h-4 w-14 shimmer" />
          <div className="h-4 w-10 shimmer" />
        </div>
      </div>
    </div>
  );
}

