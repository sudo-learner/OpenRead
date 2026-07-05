import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  category: string;
};

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/reader/?id=${book.id}`}
      className="glass rounded-xl2 p-3 hover:glow-primary transition block w-40 shrink-0"
    >
      <div className="w-full h-52 bg-black/40 rounded-lg overflow-hidden mb-2">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            No cover
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{book.title}</p>
      <p className="text-xs text-white/50 truncate">{book.author}</p>
    </Link>
  );
}
