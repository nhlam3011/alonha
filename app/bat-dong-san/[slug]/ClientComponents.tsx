"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

export function PhoneContact({
    displayPhone,
}: {
    displayPhone: string;
}) {
    const { data: session } = useSession();
    const [showPhone, setShowPhone] = useState(false);

    if (!displayPhone) return null;
    const maskedPhone = displayPhone.length >= 7 ? displayPhone.slice(0, 4) + " *** ***" : displayPhone;

    return (
        <>
            {showPhone ? (
                <a
                    href={`tel:${displayPhone}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)]/10 py-3 text-center text-lg font-bold text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 dark:bg-[var(--primary)]/20 dark:text-[var(--primary)] dark:border-[var(--primary)]/40 hover:dark:bg-[var(--primary)] hover:dark:text-[var(--primary-foreground)]"
                >
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {displayPhone}
                </a>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        if (!session) {
                            window.location.href = `/dang-nhap?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                            return;
                        }
                        setShowPhone(true);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 font-bold text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/25 transition-all duration-300 active:scale-95"
                >
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {maskedPhone}
                </button>
            )}

            <a
                href={`https://zalo.me/${displayPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 font-semibold text-[var(--foreground)] shadow-sm hover:border-[var(--primary)]/50 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 dark:bg-white/5 dark:hover:bg-[var(--primary)]"
            >
                Chat Zalo
            </a>
        </>
    );
}

export function ActionButtons({ listingId }: { listingId: string }) {
    const { data: session } = useSession();
    const [saved, setSaved] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compared, setCompared] = useState(false);

    async function toggleSave() {
        if (!session) {
            window.location.href = `/dang-nhap?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        if (saved) {
            await fetch(`/api/favorites?listingId=${listingId}`, { method: "DELETE" });
            setSaved(false);
        } else {
            await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId }) });
            setSaved(true);
        }
    }

    async function addToCompare() {
        if (compareLoading) return;
        setCompareLoading(true);
        try {
            const res = await fetch("/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error || "Không thể thêm vào so sánh.");
                return;
            }
            setCompared(true);
            window.dispatchEvent(new CustomEvent("compare-updated"));
        } catch {
            alert("Không thể thêm vào so sánh.");
        } finally {
            setCompareLoading(false);
        }
    }

    return (
        <>
            <button 
                type="button" 
                onClick={toggleSave} 
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    saved 
                        ? "border-rose-500 text-rose-500" 
                        : "border-[var(--border)] hover:bg-[var(--background)]"
                }`}
            >
                {saved ? (
                    <svg className="size-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                ) : (
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                )}
                {saved ? "Đã lưu tin" : "Lưu tin yêu thích"}
            </button>
            <button
                type="button"
                onClick={addToCompare}
                disabled={compareLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)] disabled:opacity-70 transition-colors"
            >
                {compareLoading ? "Đang thêm..." : compared ? "Đã thêm so sánh" : "Thêm vào so sánh"}
            </button>
            <Link href="/cong-cu/so-sanh" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)] transition-colors">
                Xem danh sách so sánh
            </Link>
        </>
    );
}

export function ContactSidebar({ listingId }: { listingId: string }) {
    const [formSent, setFormSent] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", message: "" });

    async function submitContact(e: React.FormEvent) {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId, name: form.name, phone: form.phone, message: form.message || undefined }),
            });
            const data = await res.json().catch(() => ({}));
            if (data.ok) {
                setFormSent(true);
                setForm({ name: "", phone: "", message: "" });
            } else alert(data.error || "Gửi thất bại");
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">HOẶC LIÊN HỆ LẠI</p>
            {formSent ? (
                <p className="mt-2 text-sm text-[var(--primary)]">Đã gửi yêu cầu. Chúng tôi sẽ liên hệ bạn sớm.</p>
            ) : (
                <form onSubmit={submitContact} className="mt-3 space-y-3">
                    <input
                        type="text"
                        placeholder="Họ tên"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="form-input"
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Số điện thoại"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="form-input"
                        required
                    />
                    <textarea
                        placeholder="Tôi quan tâm..."
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        rows={2}
                        className="form-input"
                    />
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="btn-primary w-full justify-center py-3"
                    >
                        {formLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                </form>
            )}
        </div>
    );
}

export function AIFeatures({
    description,
    descShort,
    descFull,
    showMore
}: {
    description: string;
    descShort: string;
    descFull: string;
    showMore: boolean;
}) {
    const [descExpanded, setDescExpanded] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [summarizedDesc, setSummarizedDesc] = useState("");
    const [showSummary, setShowSummary] = useState(false);

    const [analyzing, setAnalyzing] = useState(false);
    const [sentiment, setSentiment] = useState<{
        sentiment: string; score: number; keyPoints: string[]; summary: string;
    } | null>(null);

    const handleSummarize = async () => {
        if (summarizedDesc) {
            setShowSummary(!showSummary);
            return;
        }
        setSummarizing(true);
        try {
            const res = await fetch("/api/nlp/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, maxLength: 300 }),
            });
            const data = await res.json();
            if (data.summary) {
                setSummarizedDesc(data.summary);
                setShowSummary(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSummarizing(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch("/api/nlp/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: description }),
            });
            const data = await res.json();
            if (data.sentiment) setSentiment(data);
        } catch (e) { console.error(e); }
        finally { setAnalyzing(false); }
    };

    return (
        <>
            {/* Mô tả chi tiết */}
            <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Mô tả chi tiết</h2>
                        {summarizedDesc && (
                            <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                                AI
                            </span>
                        )}
                    </div>
                    {description && description.length > 100 && (
                        <button
                            type="button"
                            onClick={handleSummarize}
                            disabled={summarizing}
                            className="flex items-center gap-1 rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                            {summarizing ? "Đang tóm tắt..." : summarizedDesc ? (showSummary ? "Xem đầy đủ" : "Xem tóm tắt") : "Tóm tắt AI"}
                        </button>
                    )}
                </div>
                <div className="mt-3 text-[var(--muted-foreground)]">
                    {showSummary && summarizedDesc ? (
                        <p className="whitespace-pre-line">{summarizedDesc}</p>
                    ) : (
                        <>
                            {descExpanded || !showMore ? (
                                <p className="whitespace-pre-line">{descFull || "Chưa có mô tả."}</p>
                            ) : (
                                <p className="whitespace-pre-line">{descShort}</p>
                            )}
                            {showMore && !descExpanded && (
                                <button
                                    type="button"
                                    onClick={() => setDescExpanded(true)}
                                    className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline"
                                >
                                    Xem thêm
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* NLP Sentiment Analysis */}
            {description && description.length > 50 && (
                <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Phân tích NLP</h2>
                            <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">AI</span>
                        </div>
                        {!sentiment && (
                            <button
                                type="button"
                                disabled={analyzing}
                                onClick={handleAnalyze}
                                className="flex items-center gap-1.5 rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:opacity-80 disabled:opacity-50 transition-opacity"
                            >
                                {analyzing ? (
                                    <><span className="size-3 animate-spin rounded-full border border-[var(--primary)] border-t-transparent" /> Đang phân tích...</>
                                ) : (
                                    <>🧠 Phân tích cảm xúc</>
                                )}
                            </button>
                        )}
                    </div>

                    {sentiment ? (
                        <div className="mt-4 space-y-4">
                            {/* Score bar */}
                            <div className="flex items-center gap-3">
                                <span className={sentiment.sentiment === "POSITIVE" ? "badge-success" : sentiment.sentiment === "NEGATIVE" ? "badge-destructive" : "badge"}>
                                    {sentiment.sentiment === "POSITIVE" ? "Tích cực" : sentiment.sentiment === "NEGATIVE" ? "Tiêu cực" : "Trung tính"}
                                </span>
                                <div className="flex-1">
                                    <div className="h-2 rounded-full bg-[var(--muted)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${Math.round(((sentiment.score + 1) / 2) * 100)}%`,
                                                backgroundColor: sentiment.score > 0.3 ? "var(--primary)" : sentiment.score < -0.3 ? "var(--accent)" : "var(--muted-foreground)",
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-[var(--foreground)]">{(sentiment.score * 100).toFixed(0)}%</span>
                            </div>

                            {/* Key points */}
                            {sentiment.keyPoints.length > 0 && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {sentiment.keyPoints.map((point, i) => {
                                        const isPositive = point.startsWith("positive:");
                                        const text = point.replace(/^(positive|negative):/, "").trim();
                                        return (
                                            <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5">
                                                <span className={`mt-0.5 shrink-0 text-xs ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {isPositive ? "✓" : "✕"}
                                                </span>
                                                <span className="text-xs text-[var(--foreground)]">{text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Summary */}
                            {sentiment.summary && (
                                <p className="rounded-lg bg-[var(--muted)] p-3 text-sm leading-relaxed text-[var(--foreground)]">
                                    {sentiment.summary}
                                </p>
                            )}
                        </div>
                    ) : !analyzing ? (
                        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                            Phân tích cảm xúc mô tả tin đăng bằng AI để xác định điểm mạnh, điểm yếu.
                        </p>
                    ) : null}
                </section>
            )}
        </>
    );
}
export function ImageGallery({ images, title }: { images: { url: string }[], title: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openGallery = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeGallery = () => {
        setIsOpen(false);
        document.body.style.overflow = "auto";
    };

    const validImages = images.filter(img => img?.url && img.url !== "" && img.url !== "undefined");
    const mainImg = validImages[0]?.url || "/images/placeholder-real-estate.png";
    const placeholder = "/images/placeholder-real-estate.png";

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (validImages.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (validImages.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    return (
        <>
            <div className="relative grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                {/* Main Image */}
                <div
                    className="relative col-span-4 row-span-2 min-h-[240px] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-full group cursor-pointer"
                    onClick={() => openGallery(0)}
                >
                    <div className="relative aspect-[4/3] h-full min-h-[240px] sm:absolute sm:inset-0 overflow-hidden">
                        <img
                            src={mainImg}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.src = placeholder; }}
                        />
                    </div>
                    {validImages.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openGallery(0); }}
                            className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-2 text-sm font-medium text-white hover:bg-black/80 sm:bottom-4 sm:right-4 backdrop-blur-sm transition-colors"
                        >
                            Xem tất cả ({validImages.length} ảnh)
                        </button>
                    )}
                </div>

                {/* Sub images for desktop - Chỉ render nếu có ảnh tương ứng */}
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="relative aspect-[4/3] hidden sm:block overflow-hidden cursor-pointer"
                        onClick={() => openGallery(i < validImages.length ? i : 0)}
                    >
                        <img
                            src={validImages[i]?.url || placeholder}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                            onError={(e) => { e.currentTarget.src = placeholder; }}
                        />
                        {i === 4 && validImages.length > 5 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xl font-bold text-white">
                                +{validImages.length - 5}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox / Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 backdrop-blur-sm"
                    onClick={closeGallery}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeGallery();
                        if (e.key === "ArrowRight") nextImage();
                        if (e.key === "ArrowLeft") prevImage();
                    }}
                    tabIndex={0}
                >
                    <button
                        onClick={closeGallery}
                        className="absolute top-4 right-4 z-[110] rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    >
                        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={prevImage}
                            className="absolute left-0 z-[110] rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"
                        >
                            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        <div className="relative max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl">
                            <img
                                src={validImages[currentIndex]?.url || placeholder}
                                alt={`${title} - ${currentIndex + 1}`}
                                className="max-h-[85vh] object-contain"
                                onError={(e) => { e.currentTarget.src = placeholder; }}
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
                                {currentIndex + 1} / {validImages.length}
                            </div>
                        </div>

                        <button
                            onClick={nextImage}
                            className="absolute right-0 z-[110] rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"
                        >
                            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Thumbnails at bottom */}
                    <div
                        className="absolute bottom-6 left-0 right-0 hidden justify-center gap-2 overflow-x-auto px-4 py-2 sm:flex"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {validImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${idx === currentIndex ? "border-[var(--primary)] scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"}`}
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(e) => { e.currentTarget.src = placeholder; }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

