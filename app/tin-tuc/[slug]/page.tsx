import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type NewsArticle = {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    category: string;
    categoryLabel: string;
    imageUrl: string;
    author: string;
    authorAvatar?: string;
    publishedAt: string;
    readTime: number;
    views: number;
    tags: string[];
};

const SAMPLE_ARTICLE: NewsArticle = {
    id: "1",
    slug: "xu-huong-gia-bat-dong-san-2024",
    title: "Xu hướng giá bất động sản 2024: Những điểm sáng và thách thức",
    content: `
  <p>Thị trường bất động sản năm 2024 dự báo sẽ có nhiều biến động với sự phân hóa rõ rệt giữa các phân khúc. Các chuyên gia đưa ra dự báo về xu hướng giá trong thời gian tới.</p>
  
  <h2>Tổng quan thị trường</h2>
  <p>Theo các chuyên gia kinh tế, thị trường bất động sản Việt Nam trong năm 2024 sẽ chịu ảnh hưởng bởi nhiều yếu tố vĩ mô như lãi suất, chính sách tín dụng và tình hình kinh tế toàn cầu.</p>
  
  <p>Các dự báo cho thấy thị trường sẽ có sự phân hóa rõ rệt giữa các phân khúc và khu vực. Trong khi bất động sản cao cấp có thể giảm nhiệt, thì phân khúc nhà ở trung cấp và bình dân vẫn duy trì sức cầu ổn định.</p>
  
  <h2>Các yếu tố ảnh hưởng</h2>
  <h3>1. Chính sách tín dụng</h3>
  <p>Ngân hàng Nhà nước tiếp tục duy trì chính sách tiền tệ thận trọng, lãi suất cho vay bất động sản vẫn ở mức cao. Điều này ảnh hưởng trực tiếp đến khả năng tiếp cận vốn của người mua nhà.</p>
  
  <h3>2. Quy hoạch và pháp lý</h3>
  <p>Các vấn đề về quy hoạch và pháp lý vẫn là rào cản lớn cho thị trường. Nhiều dự án bị đình trệ do vướng mắc pháp lý, gây ảnh hưởng đến nguồn cung.</p>
  
  <h3>3. Nhu cầu thực</h3>
  <p>Nhu cầu nhà ở thực vẫn rất lớn, đặc biệt tại các đô thị lớn. Tuy nhiên, sức mua bị hạn chế do thu nhập người dân chưa tăng tương ứng với giá nhà.</p>
  
  <h2>Dự báo theo phân khúc</h2>
  <p><strong>Căn hộ chung cư:</strong> Dự kiến giá sẽ tăng nhẹ 3-5% tại các vị trí tốt, đặc biệt ở các dự án đã hoàn thiện hạ tầng và tiện ích.</p>
  
  <p><strong>Nhà phố, biệt thự:</strong> Phân khúc này có thể giảm giá 5-10% do nguồn cung dồi dào và sức cầu hạn chế.</p>
  
  <p><strong>Đất nền:</strong> Biến động mạnh tùy thuộc vào vị trí và pháp lý. Các dự án có pháp lý clear vẫn được săn đón.</p>
  
  <h2>Lời khuyên cho nhà đầu tư</h2>
  <p>Các chuyên gia khuyến nghị nhà đầu tư nên:</p>
  <ul>
    <li>Tập trung vào các dự án có pháp lý hoàn chỉnh</li>
    <li>Ưu tiên vị trí có hạ tầng giao thông phát triển</li>
    <li>Tránh đầu cơ, tập trung vào giá trị thực</li>
    <li>Theo dõi sát chính sách vĩ mô</li>
  </ul>
  
  <h2>Kết luận</h2>
  <p>Thị trường bất động sản 2024 sẽ là năm của sự chọn lọc. Nhà đầu tư cần thận trọng and có chiến lược rõ ràng để tối ưu hóa lợi nhuận và giảm thiểu rủi ro.</p>
`,
    excerpt: "Thị trường bất động sản năm 2024 dự báo sẽ có nhiều biến động với sự phân hóa rõ rệt giữa các phân khúc.",
    category: "thi-truong",
    categoryLabel: "Thị trường",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    author: "Nguyễn Văn A",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    publishedAt: "2024-01-15",
    readTime: 5,
    views: 1250,
    tags: ["bất động sản", "đầu tư", "thị trường", "2024"],
};

const RELATED_ARTICLES = [
    {
        id: "2",
        slug: "chinh-sach-nha-o-moi-2024",
        title: "Chính sách nhà ở mới 2024: Những thay đổi quan trọng cần biết",
        imageUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
        categoryLabel: "Chính sách",
        publishedAt: "2024-01-12",
    },
    {
        id: "3",
        slug: "huong-dan-mua-nha-dat",
        title: "Hướng dẫn mua nhà đất cho người mới bắt đầu",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
        categoryLabel: "Cẩm nang",
        publishedAt: "2024-01-10",
    },
    {
        id: "4",
        slug: "du-an-vinhomes-ocean-park",
        title: "Review chi tiết dự án Vinhomes Ocean Park 2",
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        categoryLabel: "Dự án",
        publishedAt: "2024-01-08",
    },
];

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    const article = SAMPLE_ARTICLE.slug === slug ? SAMPLE_ARTICLE : null;

    if (!article) return { title: "Không tìm thấy bài viết | AloNha" };

    return {
        title: `${article.title} | AloNha`,
        description: article.excerpt,
        openGraph: {
            title: article.title,
            description: article.excerpt,
            images: [article.imageUrl],
            type: "article",
            publishedTime: article.publishedAt,
            authors: [article.author],
        },
    };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    await new Promise(resolve => setTimeout(resolve, 300));

    const article = SAMPLE_ARTICLE.slug === slug ? SAMPLE_ARTICLE : null;

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="layout-container px-4 py-6 md:px-10">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-8 overflow-x-auto scrollbar-none whitespace-nowrap">
                        <Link href="/" className="hover:text-[var(--primary)] transition-colors font-medium">
                            Trang chủ
                        </Link>
                        <svg className="size-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href="/tin-tuc" className="hover:text-[var(--primary)] transition-colors font-medium">
                            Tin tức
                        </Link>
                        <svg className="size-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[var(--foreground)] font-semibold truncate">{article.title}</span>
                    </nav>

                    {/* Article Header */}
                    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm lg:shadow-md mb-12">
                        {/* Featured Image */}
                        <div className="relative h-64 sm:h-[480px] overflow-hidden bg-[var(--muted)] shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>

                        {/* Article Content */}
                        <div className="p-6 sm:p-10 lg:p-12">
                            {/* Category & Meta */}
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className="inline-block rounded-lg bg-[var(--primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-[var(--primary)]/20">
                                    {article.categoryLabel}
                                </span>
                                <div className="flex items-center gap-4 text-xs font-semibold text-[var(--muted-foreground)]">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {formatDate(article.publishedAt)}
                                    </span>
                                    <span className="opacity-20">|</span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {article.readTime} phút đọc
                                    </span>
                                    <span className="opacity-20">|</span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {article.views.toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] mb-8 tracking-tight leading-tight">
                                {article.title}
                            </h1>

                            {/* Author */}
                            <div className="flex items-center gap-4 mb-10 pb-10 border-b border-[var(--border)] border-dashed">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--muted)] shadow-md border-2 border-white ring-8 ring-[var(--primary-light)]/30">
                                    {article.authorAvatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={article.authorAvatar}
                                            alt={article.author}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] bg-[var(--card)]">
                                            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-bold text-lg text-[var(--foreground)] tracking-tight">{article.author}</p>
                                    <p className="text-xs font-semibold text-[var(--muted-foreground)] tracking-wide uppercase opacity-70">Biên tập viên AloNha</p>
                                </div>
                            </div>

                            {/* Article Body */}
                            <div
                                className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-[var(--foreground)] prose-headings:font-bold prose-headings:tracking-tight prose-p:text-[var(--foreground)] prose-p:leading-relaxed prose-a:text-[var(--primary)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--foreground)] prose-strong:font-bold prose-img:rounded-3xl prose-img:shadow-lg prose-ul:text-[var(--foreground)] prose-ol:text-[var(--foreground)] prose-li:text-[var(--foreground)]"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />

                            {/* Tags */}
                            <div className="mt-12 pt-8 border-t border-[var(--border)] border-dashed">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-bold text-[var(--foreground)] mr-1">Thẻ bài viết:</span>
                                    {article.tags.map((tag) => (
                                        <Link
                                            key={tag}
                                            href={`/tin-tuc?tag=${tag}`}
                                            className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all duration-300"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Share */}
                            <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-[var(--primary-light)]/20 border border-[var(--primary-light)]/30">
                                <span className="text-sm font-bold text-[var(--primary)] ml-2">Chia sẻ bài viết này:</span>
                                <div className="flex items-center gap-3">
                                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1877F2] shadow-sm hover:scale-110 transition-transform">
                                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </button>
                                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1DA1F2] shadow-sm hover:scale-110 transition-transform">
                                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </button>
                                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm hover:scale-110 transition-transform">
                                        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Related Articles */}
                    <section className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">Bài viết liên quan</h2>
                            <Link href="/tin-tuc" className="text-sm font-bold text-[var(--primary)] hover:underline flex items-center gap-1.5 transition-all hover:gap-2">
                                Xem tất cả <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {RELATED_ARTICLES.map((related) => (
                                <Link
                                    key={related.id}
                                    href={`/tin-tuc/${related.slug}`}
                                    className="group h-full flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)] shrink-0 shadow-inner">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={related.imageUrl}
                                            alt={related.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-md self-start mb-3">{related.categoryLabel}</span>
                                        <h3 className="text-lg font-bold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors leading-tight tracking-tight">
                                            {related.title}
                                        </h3>
                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--border)] border-dashed">
                                            <span className="text-[10px] font-bold text-[var(--muted-foreground)] opacity-60">
                                                {formatDate(related.publishedAt)}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                Xem <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
