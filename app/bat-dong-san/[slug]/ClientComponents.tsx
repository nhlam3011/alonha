"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
                <a href={`tel:${displayPhone}`} className="mt-4 block text-center text-lg font-semibold text-[var(--primary)]">
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
                    className="mt-4 w-full rounded-xl bg-[var(--primary)] py-3 font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors"
                >
                    {maskedPhone} (Hiện số)
                </button>
            )}

            <a
                href={`https://zalo.me/${displayPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 font-medium hover:bg-[var(--background)] transition-colors"
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
            <button type="button" onClick={toggleSave} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-medium hover:bg-[var(--background)] transition-colors">
                {saved ? "Đã lưu" : "Lưu tin yêu thích"}
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
