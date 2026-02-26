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

// Dữ liệu mock (tương lai sẽ thay bằng gọi DB/API thực tế)
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
  <p>Thị trường bất động sản 2024 sẽ là năm của sự chọn lọc. Nhà đầu tư cần thận trọng và có chiến lược rõ ràng để tối ưu hóa lợi nhuận và giảm thiểu rủi ro.</p>
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

    // Tương lai: const article = await getArticleBySlug(slug);
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

    // Giả lập delay server fetch, thay vì useEffect ở client
    await new Promise(resolve => setTimeout(resolve, 300));

    // Tương lai: fetch DB thực tế
    const article = SAMPLE_ARTICLE.slug === slug ? SAMPLE_ARTICLE : null;

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="layout-container px-4 py-6 md:px-10">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                        <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
                            Trang chủ
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href="/tin-tuc" className="hover:text-[var(--foreground)] transition-colors">
                            Tin tức
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[var(--foreground)] line-clamp-1">{article.title}</span>
                    </nav>

                    {/* Article Header */}
                    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
                        {/* Featured Image */}
                        <div className="relative h-64 sm:h-96 overflow-hidden bg-[var(--muted)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                        </div>

                        {/* Article Content */}
                        <div className="p-6 sm:p-8">
                            {/* Category & Meta */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="inline-block rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                                    {article.categoryLabel}
                                </span>
                                <span className="text-sm text-[var(--muted-foreground)]">
                                    {formatDate(article.publishedAt)}
                                </span>
                                <span className="text-sm text-[var(--muted-foreground)]">•</span>
                                <span className="text-sm text-[var(--muted-foreground)]">
                                    {article.readTime} phút đọc
                                </span>
                                <span className="text-sm text-[var(--muted-foreground)]">•</span>
                                <span className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {article.views.toLocaleString("vi-VN")}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4">
                                {article.title}
                            </h1>

                            {/* Author */}
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--border)]">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--muted)] shadow-sm">
                                    {article.authorAvatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={article.authorAvatar}
                                            alt={article.author}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--foreground)]">{article.author}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">Tác giả</p>
                                </div>
                            </div>

                            {/* Article Body */}
                            <div
                                className="prose prose-sm sm:prose-base max-w-none prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-a:text-[var(--primary)] prose-strong:text-[var(--foreground)] prose-ul:text-[var(--foreground)] prose-ol:text-[var(--foreground)] prose-li:text-[var(--foreground)]"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />

                            {/* Tags */}
                            <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--foreground)]">Tags:</span>
                                    {article.tags.map((tag) => (
                                        <Link
                                            key={tag}
                                            href={`/tin-tuc?tag=${tag}`}
                                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Share */}
                            <div className="mt-6 flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--foreground)]">Chia sẻ:</span>
                                <div className="flex items-center gap-2">
                                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </button>
                                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </button>
                                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Related Articles */}
                    <section className="mt-10">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Bài viết liên quan</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {RELATED_ARTICLES.map((related) => (
                                <Link
                                    key={related.id}
                                    href={`/tin-tuc/${related.slug}`}
                                    className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-lg transition-all"
                                >
                                    <div className="relative h-32 overflow-hidden bg-[var(--muted)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={related.imageUrl}
                                            alt={related.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <span className="text-xs font-semibold text-[var(--primary)]">{related.categoryLabel}</span>
                                        <h3 className="mt-1 text-sm font-bold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                                            {related.title}
                                        </h3>
                                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                                            {formatDate(related.publishedAt)}
                                        </p>
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
