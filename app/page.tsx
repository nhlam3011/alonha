import Link from "next/link";
import { HeroSearch } from "@/components/search/HeroSearch";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { prisma } from "@/lib/prisma";
import { getProvinces } from "@/lib/provinces";
import { toListingCard, listingSelectCard } from "@/lib/listings";

// Inline SVG Icons
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);
const Building2Icon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
);
const HomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
);
const TreePineIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.8 1.7H17Z" /><path d="M12 22v-3" /></svg>
);
const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const MoveRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8L22 12L18 16" /><path d="M2 12H22" /></svg>
);

const CATEGORIES = [
  {
    href: "/bat-dong-san?category=can-ho-chung-cu",
    label: "Căn hộ cao cấp",
    desc: "Không gian sống hiện đại",
    count: "2,400+",
    icon: <Building2Icon className="w-6 h-6" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/50"
  },
  {
    href: "/bat-dong-san?category=nha-rieng",
    label: "Nhà riêng",
    desc: "Tổ ấm trọn vẹn",
    count: "3,200+",
    icon: <HomeIcon className="w-6 h-6" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/50"
  },
  {
    href: "/bat-dong-san?category=dat-nen",
    label: "Đất nền",
    desc: "Đầu tư sinh lời",
    count: "1,800+",
    icon: <MapPinIcon className="w-6 h-6" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "group-hover:border-amber-500/50"
  },
  {
    href: "/bat-dong-san?category=biet-thu",
    label: "Biệt thự",
    desc: "Kiến trúc sang trọng",
    count: "890+",
    icon: <TreePineIcon className="w-6 h-6" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/50"
  },
];

const POPULAR_CITIES = [
  { id: "ho-chi-minh", name: "TP. Hồ Chí Minh", count: "5,200+", image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80&w=800" },
  { id: "ha-noi", name: "Hà Nội", count: "3,800+", image: "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&q=80&w=800" },
  { id: "da-nang", name: "Đà Nẵng", count: "1,200+", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=800" },
  { id: "can-tho", name: "Cần Thơ", count: "800+", image: "https://images.unsplash.com/photo-1582264628469-650adbbdb13e?auto=format&fit=crop&q=80&w=800" },
  { id: "hai-phong", name: "Hải Phòng", count: "600+", image: "https://images.unsplash.com/photo-1558284581-2287953257fc?auto=format&fit=crop&q=80&w=800" },
];

export const revalidate = 60; // SSR with ISR cache (revalidate every 60s)

export default async function HomePage() {
  // 1. Fetch Featured Listings
  const featuredDb = await prisma.listing.findMany({
    where: { status: "APPROVED", publishedAt: { not: null } },
    orderBy: [{ isVip: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: listingSelectCard,
  });
  const featuredListings = featuredDb.map(row => toListingCard(row as any));

  // 2. Fetch VIP Listings
  const vipDb = await prisma.listing.findMany({
    where: { status: "APPROVED", publishedAt: { not: null }, isVip: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: listingSelectCard,
  });
  const vipListings = vipDb.map(row => toListingCard(row as any));

  // 3. Fetch Projects
  const projectsDb = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      _count: { select: { listings: true } },
    },
  });
  const projects = projectsDb.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    totalArea: p.totalArea,
    listingCount: p._count.listings,
    province: p.provinceName ? { name: p.provinceName } : undefined
  }));

  // 4. Fetch Provinces
  const externalProvinces = await getProvinces();
  const listingsByProvince = await prisma.listing.groupBy({
    by: ["provinceCode"],
    where: {
      status: "APPROVED",
      publishedAt: { not: null },
      provinceCode: { not: null },
    },
    _count: { id: true },
  });

  const countMap = new Map<string, number>();
  for (const item of listingsByProvince) {
    if (item.provinceCode) {
      countMap.set(String(item.provinceCode), item._count.id);
    }
  }

  const provincesUnsorted = externalProvinces.map((prov) => ({
    id: String(prov.code),
    name: prov.name,
    listingCount: countMap.get(String(prov.code)) || 0,
  }));
  const provinces = provincesUnsorted.filter(p => p.listingCount > 0).sort((a, b) => b.listingCount - a.listingCount).slice(0, 12);

  return (
    <div className="bg-[var(--background)] min-h-screen overflow-x-hidden">
      {/* ━━━ HERO — Cinematic & Premium ━━━ */}
      <section className="relative h-[100dvh] flex flex-col pt-12">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80"
            alt="Luxury Architecture"
            className="w-full h-full object-cover select-none scale-105 animate-pulse-slow origin-center"
            draggable="false"
            style={{ animationDuration: '20s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[var(--background)] z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
        </div>

        <div className="layout-container relative z-20 w-full">
          <div className="max-w-4xl space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border-white/20 text-white text-xs sm:text-sm font-semibold shadow-2xl animate-fade-in backdrop-blur-md">
              <SparklesIcon className="w-4 h-4 text-emerald-400" />
              <span>Nền tảng BĐS Thông Minh Hàng Đầu</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-extrabold text-white leading-[1.05] tracking-tight animate-slide-up [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]" style={{ animationDelay: '100ms' }}>
              Kiến tạo <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">
                không gian sống
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl animate-slide-up leading-relaxed font-medium [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]" style={{ animationDelay: '200ms' }}>
              Khám phá hàng ngàn bất động sản đẳng cấp với công nghệ AI đột phá, dữ liệu thị trường minh bạch và biểu đồ trực quan.
            </p>
          </div>

          <div className="animate-slide-up w-full max-w-6xl mx-auto relative group" style={{ animationDelay: '300ms' }}>
            <div className="relative glass-strong rounded-[2rem] p-2 sm:p-4 shadow-2xl border border-white/10 dark:border-white/5 backdrop-blur-xl">
              <HeroSearch embedded={true} />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FLOATING STATS ━━━ */}
      <div className="relative z-30 -mt-12 sm:-mt-16 mb-20 px-4">
        <div className="max-w-5xl mx-auto glass border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5" />
          {[
            { label: "Bất động sản", value: "25K+", icon: <Building2Icon className="w-5 h-5" />, color: "text-blue-500" },
            { label: "Dự án mới", value: "1.2K+", icon: <StarIcon className="w-5 h-5" />, color: "text-emerald-500" },
            { label: "Đã giao dịch", value: "15K+", icon: <TrendingUpIcon className="w-5 h-5" />, color: "text-violet-500" },
            { label: "Chuyên gia", value: "3K+", icon: <SparklesIcon className="w-5 h-5" />, color: "text-amber-500" },
          ].map((stat, i) => (
            <div key={i} className="text-center relative z-10 group">
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-[var(--background)] shadow-sm border border-[var(--border)] ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${stat.color} tracking-tight drop-shadow-sm`}>{stat.value}</div>
              <div className="text-[11px] sm:text-sm font-semibold text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━ CATEGORIES — Interactive Cards ━━━ */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="layout-container relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] mb-2 uppercase tracking-wide">
                <SparklesIcon className="w-4 h-4" /> Khám Phá
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">Danh mục nổi bật</h2>
              <p className="text-[var(--muted-foreground)] mt-3 text-base sm:text-lg">Tìm kiếm tài sản theo loại hình phù hợp với nhu cầu của bạn</p>
            </div>
            <Link href="/bat-dong-san" className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
              Xem tất cả <MoveRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group flex flex-col p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative ${cat.border}`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500">
                  {cat.icon}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors">{cat.label}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{cat.desc}</p>
                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm font-medium">
                  <span className="text-[var(--muted-foreground)]"><strong className="text-[var(--foreground)]">{cat.count}</strong> tin đăng</span>
                  <span className="text-[var(--primary)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ VIP LISTINGS — Premium Glow ━━━ */}
      {vipListings.length > 0 && (
        <section className="py-20 sm:py-28 relative bg-gradient-to-b from-[var(--surface)] to-[var(--background)] border-y border-[var(--border)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="layout-container relative z-10">
            <div className="flex flex-col items-center text-center mb-14">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-widest mb-4 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <StarIcon className="w-4 h-4 fill-amber-500 dark:fill-amber-400" /> Tuyển Tập Độc Quyền
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight mb-4">Tuyệt Tác An Cư</h2>
              <p className="text-[var(--muted-foreground)] text-base sm:text-lg max-w-2xl">Khám phá những bất động sản xa hoa bậc nhất, được tinh tuyển khắt khe dành riêng cho giới tinh hoa.</p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {vipListings.map((listing) => (
                <div key={listing.id} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-amber-500/50 to-transparent rounded-[1.25rem] opacity-0 group-hover:opacity-100 blur-md transition duration-500"></div>
                  <div className="relative z-10 h-full [&>div]:h-full">
                    <PropertyCard listing={listing} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/bat-dong-san?isVip=true" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-1 transition-all duration-300">
                Khám Phá Bộ Sưu Tập VIP <SparklesIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ━━━ POPULAR CITIES — Enhanced Bento ━━━ */}
      <section className="py-20 sm:py-24 bg-[var(--surface)]">
        <div className="layout-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--secondary)] mb-2 uppercase tracking-wide">
                <MapPinIcon className="w-4 h-4" /> Vị Trí Vàng
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">Khu Vực Trọng Điểm</h2>
              <p className="text-[var(--muted-foreground)] mt-3 text-base sm:text-lg">Tâm điểm giao thương, nơi hội tụ những giá trị bền vững</p>
            </div>
          </div>

          {/* Bento layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] sm:auto-rows-[250px] lg:auto-rows-[300px]">
            {POPULAR_CITIES.slice(0, 5).map((city, idx) => (
              <Link
                key={city.id}
                href={`/bat-dong-san?province=${city.id}`}
                className={`group relative rounded-3xl overflow-hidden block ${idx === 0 ? "col-span-2 row-span-2" :
                  idx === 1 ? "col-span-2 md:col-span-2 row-span-1" :
                    "col-span-1 md:col-span-1 row-span-1"
                  }`}
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <h3 className={`font-extrabold text-white drop-shadow-lg ${idx === 0 ? 'text-2xl md:text-4xl lg:text-5xl mb-2' : 'text-xl md:text-2xl mb-1'}`}>
                    {city.name}
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm font-medium">
                    <span>{city.count} tin đăng</span>
                    <MoveRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Location pills with glass effect */}
          {provinces.length > 5 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {provinces.filter(p => !POPULAR_CITIES.find(c => c.id === p.id)).slice(0, 10).map((province) => (
                <Link
                  key={province.id}
                  href={`/bat-dong-san?province=${province.id}`}
                  className="px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-lg transition-all"
                >
                  {province.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ━━━ PROJECTS — Modern Architecture ━━━ */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="layout-container relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] mb-2 uppercase tracking-wide">
                <Building2Icon className="w-4 h-4" /> Kỷ Nguyên Mới
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight mb-3">Dự Án Trọng Điểm</h2>
              <p className="text-[var(--muted-foreground)] text-base sm:text-lg">Những biểu tượng kiến trúc định hình không gian sống đô thị hiện đại.</p>
            </div>
            <Link href="/du-an" className="btn-outline hidden sm:inline-flex rounded-full">
              Khám phá toàn bộ danh sách
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  href={`/du-an/${project.slug || project.id}`}
                  className="group flex flex-col rounded-3xl bg-[var(--card)] border border-[var(--border)] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 card-hover"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-[var(--muted)]">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--muted)] to-[var(--background)]">
                        <Building2Icon className="w-12 h-12 text-[var(--muted-foreground)]/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {project.province && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-[var(--background)]/90 backdrop-blur-md text-[var(--foreground)] border border-[var(--border)] text-xs font-bold rounded-lg shadow-sm">
                        {project.province.name}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 mb-4">{project.name}</h3>
                    <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-[var(--muted-foreground)] text-xs mb-1">Quy mô</span>
                        <span className="font-bold text-[var(--foreground)]">{project.totalArea ? `${project.totalArea.toLocaleString()} m²` : 'Đang cập nhật'}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[var(--muted-foreground)] text-xs mb-1">Sản phẩm</span>
                        <span className="font-bold text-[var(--primary)]">{project.listingCount} tin</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
              <Building2Icon className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--muted-foreground)] font-medium text-lg">Chưa có dự án nào được cập nhật</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/du-an" className="btn-outline w-full rounded-xl">
              Danh sách dự án
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ NEW LISTINGS ━━━ */}
      <section className="py-20 sm:py-24 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="layout-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 mb-2 uppercase tracking-wide">
                <SparklesIcon className="w-4 h-4" /> Vừa Lên Sàn
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">Tin Đăng Mới Nhất</h2>
              <p className="text-[var(--muted-foreground)] mt-3 text-base sm:text-lg">Nắm bắt ngay những cơ hội an cư và đầu tư tốt nhất hôm nay</p>
            </div>
            <Link href="/bat-dong-san" className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
              Tất cả bất động sản <MoveRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {featuredListings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}
          </div>
        </div>
      </section>

      {/* ━━━ CTA — Premium Gradient ━━━ */}
      <section className="pb-20 sm:pb-32 px-4 pt-10">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-sky-500 to-teal-400 p-10 sm:p-16 md:p-20 text-center shadow-2xl group">
          {/* Animated decorative blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-300 opacity-30 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none group-hover:scale-110 transition-transform duration-1000 delay-100" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-md">
              Hành trình tìm kiếm<br />tổ ấm hoàn mỹ
            </h2>
            <p className="text-white/90 text-lg sm:text-xl font-medium mb-10 max-w-xl mx-auto">
              Tham gia ngay hôm nay để tận hưởng công nghệ AI và dữ liệu chuyên sâu cho mọi quyết định bất động sản của bạn.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dang-ky" className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 text-sm font-black rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all w-full sm:w-auto uppercase tracking-wide">
                Đăng Ký Thành Viên
              </Link>
              <Link href="/lien-he" className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/40 text-white text-sm font-bold rounded-full hover:bg-white/10 hover:border-white transition-all w-full sm:w-auto">
                Tư Vấn Ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
