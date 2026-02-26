import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";
import { toListingCard } from "@/lib/listings";

// Icons
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/dang-nhap?callbackUrl=/tai-khoan/yeu-thich");
  }

  // Fetch db directly on server
  const favs = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          project: { select: { name: true } },
          owner: { select: { id: true, name: true, phone: true, avatar: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const list: ListingCardData[] = favs.map((f: any) =>
    toListingCard(f.listing as any)
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-[var(--primary)] block"></span>
            Tin đã lưu
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">
            Danh sách các bất động sản bạn đã đánh dấu yêu thích để xem lại sau.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium bg-[var(--muted)]/10 px-4 py-2 rounded-lg border border-[var(--border)]">
          <HeartIcon className="w-4 h-4 text-[var(--primary)] fill-[var(--primary)]" />
          <span>{list.length} tin đăng</span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md p-16 text-center max-w-2xl mx-auto mt-8 shadow-sm">
          <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartIcon className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Danh sách yêu thích trống</h3>
          <p className="text-[var(--muted-foreground)] mb-8">
            Hãy nhấn biểu tượng trái tim trên các tin đăng Bất Động Sản để lưu lại những căn nhà phù hợp với bạn nhé.
          </p>
          <Link href="/bat-dong-san" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/20">
            <SearchIcon className="w-5 h-5" />
            Khám phá Bất Động Sản
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {list.map((listing) => (
            <div key={listing.id} className="transition-transform duration-300 hover:-translate-y-1">
              <PropertyCard listing={listing} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
