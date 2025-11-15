export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-zinc-500 flex justify-between gap-4">
        <span>UVA Historic Clothing Collection</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
