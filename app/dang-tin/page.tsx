"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// --- Constants & Types ---

const STEPS = [
    { id: 'basic', label: 'Thông tin cơ bản' },
    { id: 'location', label: 'Vị trí' },
    { id: 'media', label: 'Hình ảnh' },
    { id: 'detail', label: 'Chi tiết & Tiện ích' },
    { id: 'contact', label: 'Liên hệ' },
];

const CATEGORIES = [
    { value: "CAN_HO_CHUNG_CU", label: "Căn hộ chung cư" },
    { value: "NHA_RIENG", label: "Nhà riêng" },
    { value: "NHA_MAT_PHONG", label: "Nhà mặt phố" },
    { value: "DAT_NEN", label: "Đất nền" },
    { value: "KHO_NHA_XUONG", label: "Kho, nhà xưởng" },
    { value: "BDS_KHAC", label: "Khác" },
];

const LEGAL_STATUSES = [
    { value: "SO_DO", label: "Sổ đỏ/Sổ hồng" },
    { value: "HOP_DONG_MUA_BAN", label: "Hợp đồng mua bán" },
    { value: "DANG_CHO_SO", label: "Đang chờ sổ" },
    { value: "KHAC", label: "Giấy tờ khác" },
];

const DIRECTIONS = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Tây Bắc", "Đông Nam", "Tây Nam"];

const AMENITIES_LIST = [
    "Hồ bơi", "Gym", "Công viên", "Bảo vệ 24/7", "Thang máy", "Hầm để xe",
    "Gần chợ", "Gần trường học", "Sân thượng", "Ban công", "Nội thất đầy đủ",
    "Cho nuôi thú cưng", "Wifi miễn phí"
];

function formatPrice(value: number) {
    if (!value) return "0 đ";
    if (value >= 1000000000) {
        return (value / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + " tỷ";
    }
    if (value >= 1000000) {
        return (value / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + " triệu";
    }
    return new Intl.NumberFormat('vi-VN').format(value) + " đ";
}
type Province = { id: string; code?: string | null; name: string; };
type Ward = { name: string; code: number; division_type: string; codename: string; province_code: number; };

const LocationPickerMap = dynamic(() => import("@/components/maps/LocationPickerMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Đang tải bản đồ...</div>
});

// --- Helper Functions ---

function normalizeCoordinate(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return null;
    return Number(Math.min(max, Math.max(min, value)).toFixed(7));
}

// --- Main Component ---

export default function CreateListingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL Params
    const draftIdInput = searchParams.get("draftId");
    const editIdInput = searchParams.get("editId");

    // Layout State
    const [currentStep, setCurrentStep] = useState<string>('basic');
    const [isMobile, setIsMobile] = useState(false);

    // Data State
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    // Form State
    const [form, setForm] = useState({
        title: "", description: "", listingType: "SALE", category: "CAN_HO_CHUNG_CU",
        price: "" as string, priceUnit: "total" as "total" | "per_sqm", pricePerSqm: "" as string,
        area: "", bedrooms: "", bathrooms: "", direction: "", legalStatus: "",
        address: "", latitude: null as number | null, longitude: null as number | null,
        provinceId: "", districtId: "", wardId: "", projectId: "",
        contactName: "", contactPhone: "", contactEmail: "",
        imageUrls: [] as string[], amenities: [] as string[],
    });

    // Loading & UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // ID State
    const [draftId, setDraftId] = useState<string>("");
    const [editId, setEditId] = useState<string>("");

    // AI Modal State
    const [showAi, setShowAi] = useState(false);
    const [aiTone, setAiTone] = useState("chuyên nghiệp");
    const [aiTarget, setAiTarget] = useState("gia đình trẻ");
    const [aiKeys, setAiKeys] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [aiTitle, setAiTitle] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);

    // Smart Fill State
    const [smartFillText, setSmartFillText] = useState("");
    const [isSmartFilling, setIsSmartFilling] = useState(false);
    const [showSmartFill, setShowSmartFill] = useState(true);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // --- Effects ---

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auth Check
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/dang-nhap?callbackUrl=/dang-tin");
        } else if (status === "authenticated" && session?.user?.role && !["AGENT", "BUSINESS", "ADMIN"].includes(session.user.role as string)) {
            router.replace("/nang-cap-tai-khoan");
        } else if (status === "authenticated" && session?.user?.name && !form.contactName) {
            setForm(f => ({ ...f, contactName: session.user?.name ?? "" }));
        }
    }, [status, session, router]);

    // Auto-dismiss notification
    useEffect(() => {
        if (notice) {
            const timer = setTimeout(() => setNotice(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notice]);

    // Load Provinces
    useEffect(() => {
        fetch("/api/provinces").then(r => r.json()).then(data => Array.isArray(data) && setProvinces(data)).catch(() => { });
        fetch("/api/projects?limit=100").then(r => r.json()).then(res => Array.isArray(res.data) && setProjects(res.data)).catch(() => { });
    }, []);

    // Load Wards when Province changes
    useEffect(() => {
        if (!form.provinceId) { setWards([]); return; }
        const p = provinces.find(x => x.id === form.provinceId);
        if (!p?.code) return;
        fetch(`/api/wards?provinceCode=${p.code}`).then(r => r.json()).then(d => setWards(Array.isArray(d) ? d : [])).catch(() => setWards([]));
    }, [form.provinceId, provinces]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = 'vi-VN';
                rec.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            transcript += event.results[i][0].transcript;
                        }
                    }
                    if (transcript) {
                        setSmartFillText(prev => prev + ' ' + transcript);
                    }
                };
                rec.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsRecording(false);
                };
                rec.onend = () => {
                    setIsRecording(false);
                };
                setRecognition(rec);
            }
        }
    }, []);

    // Voice Recording Handler
    const handleVoiceRecording = () => {
        if (!recognition) {
            setNotice({ type: 'error', message: 'Trình duyệt không hỗ trợ ghi âm giọng nói.' });
            return;
        }
        if (isRecording) {
            recognition.stop();
        } else {
            setSmartFillText('');
            recognition.start();
            setIsRecording(true);
        }
    };

    // Load Draft/Edit
    useEffect(() => {
        const id = editIdInput || draftIdInput;
        if (!id || status !== "authenticated") return;

        setIsLoading(true);
        fetch(`/api/moi-gioi/listings/draft?id=${id}`)
            .then(r => r.json())
            .then(res => {
                if (!res?.data) return;
                const d = res.data;
                if (editIdInput) setEditId(d.id); else setDraftId(d.id);

                const hasPricePerSqm = d.pricePerSqm != null && d.pricePerSqm > 0;
                const hasPrice = d.price != null && d.price > 0;

                setForm(prev => ({
                    ...prev,
                    title: d.title ?? "", description: d.description ?? "",
                    listingType: d.listingType === "RENT" ? "RENT" : "SALE",
                    category: d.category ?? "CAN_HO_CHUNG_CU",
                    price: hasPrice ? String(d.price) : "",
                    priceUnit: (hasPricePerSqm && !hasPrice) ? "per_sqm" : "total",
                    pricePerSqm: hasPricePerSqm ? String(d.pricePerSqm) : "",
                    area: d.area ? String(d.area) : "",
                    bedrooms: d.bedrooms ? String(d.bedrooms) : "",
                    bathrooms: d.bathrooms ? String(d.bathrooms) : "",
                    direction: d.direction ?? "", legalStatus: d.legalStatus ?? "",
                    address: d.address ?? "",
                    latitude: d.latitude, longitude: d.longitude,
                    provinceId: d.provinceId ?? "", wardId: d.wardId ?? "", projectId: d.projectId ?? "",
                    contactName: d.contactName ?? prev.contactName,
                    contactPhone: d.contactPhone ?? "", contactEmail: d.contactEmail ?? "",
                    imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls : [],
                    amenities: Array.isArray(d.amenities) ? d.amenities : [],
                }));
                setNotice({ type: 'info', message: editIdInput ? "Đang chỉnh sửa tin" : "Đã tải bản nháp" });
            })
            .catch(() => setNotice({ type: 'error', message: "Lỗi tải tin" }))
            .finally(() => setIsLoading(false));
    }, [editIdInput, draftIdInput, status]);

    // --- Computed ---
    const selectedProvinceName = provinces.find(p => p.id === form.provinceId)?.name ?? "";
    const selectedWardName = wards.find(w => String(w.code) === form.wardId)?.name ?? "";

    // --- Actions ---

    const handleSave = async (isDraft = true) => {
        setIsSaving(true);
        try {
            const url = isDraft ? "/api/moi-gioi/listings/draft" : (editId ? `/api/moi-gioi/listings/${editId}` : "/api/listings");
            const method = isDraft ? "POST" : (editId ? "PUT" : "POST");

            const payload: any = {
                ...form,
                price: Number(form.price) || 0,
                pricePerSqm: form.pricePerSqm ? Number(form.pricePerSqm) : null,
                area: Number(form.area) || 0,
                bedrooms: Number(form.bedrooms) || null,
                bathrooms: Number(form.bathrooms) || null,
                provinceName: selectedProvinceName || null,
                wardName: selectedWardName || null,
                projectId: form.projectId || null,
                images: form.imageUrls,
            };

            if (isDraft) {
                payload.id = draftId || undefined;
            } else if (!editId) {
                payload.draftId = draftId || null;
            }

            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Lỗi lưu tin");

            if (isDraft) {
                if (data.data?.id) {
                    setDraftId(data.data.id);
                    if (!draftIdInput && !editIdInput) router.replace(`?draftId=${data.data.id}`);
                }
                setNotice({ type: 'success', message: "Đã lưu nháp" });
            } else {
                setNotice({ type: 'success', message: "Đăng tin thành công!" });
                if (editId) {
                    router.push("/moi-gioi/tin-dang?updated=1");
                } else {
                    router.push("/moi-gioi?created=1");
                }
            }
        } catch (err: any) {
            setNotice({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const newUrls: string[] = [];
            for (const file of Array.from(e.target.files)) {
                // Check size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    setNotice({ type: 'error', message: `File ${file.name} quá lớn (tối đa 10MB)` });
                    continue;
                }

                const fd = new FormData(); fd.append("file", file);
                const res = await fetch("/api/uploads", { method: "POST", body: fd });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || `Lỗi server (${res.status})`);
                }

                const d = await res.json();
                if (d.url) newUrls.push(d.url);
            }
            if (newUrls.length) setForm(f => ({ ...f, imageUrls: [...f.imageUrls, ...newUrls].slice(0, 10) }));
        } catch (err: any) { 
            console.error("Upload error:", err);
            setNotice({ type: 'error', message: err.message || "Lỗi tải ảnh" }); 
        }
        finally { setUploading(false); e.target.value = ""; }
    };

    const handlePinLocation = async () => {
        const q = [form.address, selectedWardName, selectedProvinceName, "Việt Nam"].filter(Boolean).join(", ");
        if (!q) return setNotice({ type: 'error', message: "Vui lòng nhập địa chỉ" });
        setIsPinning(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=vi&q=${encodeURIComponent(q)}`);
            const d = await res.json();
            if (d[0]?.lat && d[0]?.lon) {
                setForm(f => ({ ...f, latitude: Number(d[0].lat), longitude: Number(d[0].lon) }));
                setNotice({ type: 'success', message: "Đã tìm thấy vị trí" });
            } else {
                setNotice({ type: 'error', message: "Không tìm thấy vị trí" });
            }
        } catch { setNotice({ type: 'error', message: "Lỗi bản đồ" }); }
        finally { setIsPinning(false); }
    };

    const handleAiGenerate = async () => {
        setAiGenerating(true);
        setAiResult(""); setAiTitle("");
        try {
            const res = await fetch("/api/ai/generate-description", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form, price: Number(form.price), area: Number(form.area),
                    provinceName: selectedProvinceName, keywords: aiKeys, tone: aiTone, targetAudience: aiTarget
                })
            });
            const d = await res.json();
            setAiResult(d.description || "");
            if (d.suggestedTitle) setAiTitle(d.suggestedTitle);
        } catch { setAiResult("Lỗi khi tạo nội dung"); }
        finally { setAiGenerating(false); }
    };

    const handleSmartFill = async () => {
        if (!smartFillText.trim() || smartFillText.length < 10) {
            setNotice({ type: 'error', message: "Vui lòng nhập nội dung chi tiết hơn (tối thiểu 10 ký tự)." });
            return;
        }
        setIsSmartFilling(true);
        try {
            const res = await fetch("/api/ai/extract-listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: smartFillText }),
            });
            const { data } = await res.json();
            if (data) {
                setForm(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    description: data.description || prev.description,
                    listingType: data.listingType || "SALE",
                    category: data.category || "BDS_KHAC",
                    price: data.price ? String(data.price) : prev.price,
                    area: data.area ? String(data.area) : prev.area,
                    bedrooms: data.bedrooms ? String(data.bedrooms) : prev.bedrooms,
                    bathrooms: data.bathrooms ? String(data.bathrooms) : prev.bathrooms,
                    direction: data.direction || prev.direction,
                    legalStatus: data.legalStatus || prev.legalStatus,
                    address: data.address || prev.address,
                }));

                // Auto-select Province & Ward
                if (data.provinceName) {
                    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/tinh|thanh pho|tp/g, "").trim();
                    const provinceName = normalize(data.provinceName);
                    const foundProvince = provinces.find(p => normalize(p.name).includes(provinceName) || provinceName.includes(normalize(p.name)));

                    if (foundProvince) {
                        // Update province immediately
                        setForm(prev => ({ ...prev, provinceId: foundProvince.id }));

                        // Fetch wards using the same API as useEffect
                        if (foundProvince.code) {
                            try {
                                const resWards = await fetch(`/api/wards?provinceCode=${foundProvince.code}`);
                                const wardsData = await resWards.json();
                                if (Array.isArray(wardsData)) {
                                    setWards(wardsData);
                                    if (data.wardName) {
                                        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                        const wardName = normalize(data.wardName).replace(/phuong|xa|thi tran|p\.|x\.|tt\./g, "").trim();

                                        // Simple inclusion check as requested
                                        const foundWard = wardsData.find((w: Ward) => {
                                            const wName = normalize(w.name).replace(/phuong|xa|thi tran|p\.|x\.|tt\./g, "").trim();
                                            return wName.includes(wardName) || wardName.includes(wName);
                                        });

                                        if (foundWard) {
                                            setForm(prev => ({ ...prev, provinceId: foundProvince.id, wardId: String(foundWard.code) }));
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error("Error fetching wards for smart fill", e);
                            }
                        }
                    }

                    setShowSmartFill(false);
                    setSmartFillText("");
                }
            }
        } catch {
            setNotice({ type: 'error', message: "Lỗi phân tích nội dung." });
        } finally {
            setIsSmartFilling(false);
        }
    }

    // --- Render Helpers ---

    const renderInput = (label: string, field: keyof typeof form, type = "text", placeholder = "", required = false, suffix?: React.ReactNode) => (
        <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--foreground)]">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input type={type} placeholder={placeholder}
                    value={form[field] as string}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                />
                {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">{suffix}</div>}
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 'basic': return (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Loại tin đăng</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setForm(f => ({ ...f, listingType: 'SALE' }))} className={`p-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${form.listingType === 'SALE' ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--card)] hover:bg-[var(--accent)]/5 border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                                Cần bán
                            </button>
                            <button onClick={() => setForm(f => ({ ...f, listingType: 'RENT' }))} className={`p-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${form.listingType === 'RENT' ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-[var(--card)] hover:bg-[var(--accent)]/5 border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                                Cho thuê
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Danh mục bất động sản</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CATEGORIES.map(cat => (
                                <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                    className={`p-3 rounded-xl border text-left text-sm transition-all flex flex-col gap-2 ${form.category === cat.value ? 'ring-2 ring-[var(--primary)] border-transparent bg-[var(--primary)]/5' : 'hover:border-[var(--primary)]/30 border-[var(--border)] bg-[var(--card)]'}`}>
                                    <span className="font-medium text-[var(--foreground)]">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-end gap-4">
                        <div className="flex-1">
                            {renderInput("Tiêu đề tin", "title", "text", "VD: Căn hộ cao cấp view hồ...", true)}
                        </div>
                        <button onClick={() => setShowSmartFill(true)} className="mb-0.5 mt-auto text-xs flex items-center gap-1.5 text-[var(--primary)] font-semibold hover:bg-[var(--primary)]/10 px-2.5 py-2 rounded-lg border border-[var(--primary)]/20 transition-all whitespace-nowrap">
                            ⚡ Điền tin nhanh
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderInput("Giá tiền", "price", "number", "0", true, form.listingType === 'RENT' ? '/ tháng' : 'VNĐ')}
                        {renderInput("Diện tích", "area", "number", "0", true, "m²")}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-[var(--foreground)]">Mô tả chi tiết</label>
                            <button onClick={() => setShowAi(true)} className="text-xs flex items-center gap-1.5 text-[var(--primary)] font-semibold hover:bg-[var(--primary)]/10 px-2 py-1 rounded transition-colors">
                                ✨ Viết bằng AI
                            </button>
                        </div>
                        <textarea rows={6} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none text-sm leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            placeholder="Mô tả chi tiết về bất động sản của bạn..."
                        />
                    </div>
                </div >
            );
            case 'location': return (
                <div className="space-y-6 animate-fade-in h-full flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Tỉnh / Thành phố</label>
                            <SearchableSelect
                                options={provinces.map(p => ({ value: p.id, label: p.name }))}
                                value={form.provinceId}
                                onChange={(val) => setForm(f => ({ ...f, provinceId: val, wardId: "" }))}
                                placeholder="-- Chọn Tỉnh/Thành --"
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Dự án (Nếu có)</label>
                            <SearchableSelect
                                options={projects.map(p => ({ value: p.id, label: p.name }))}
                                value={form.projectId}
                                onChange={(val) => {
                                    const proj = projects.find(p => p.id === val);
                                    setForm(f => ({
                                        ...f,
                                        projectId: val,
                                        provinceId: proj?.provinceCode || f.provinceId,
                                        wardId: proj?.wardCode || f.wardId,
                                        address: proj?.address || f.address
                                    }));
                                }}
                                placeholder="-- Chọn Dự án --"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Phường / Xã</label>
                            <SearchableSelect
                                options={wards.map(w => ({ value: String(w.code), label: w.name }))}
                                value={form.wardId}
                                onChange={(val) => setForm(f => ({ ...f, wardId: val }))}
                                placeholder="-- Chọn Phường/Xã --"
                                disabled={!form.provinceId}
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Địa chỉ cụ thể</label>
                            <div className="flex gap-2">
                                <input className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                                    value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Số nhà, tên đường..." />
                                <button onClick={() => void handlePinLocation()} disabled={isPinning} className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium">Ghim</button>
                            </div>
                        </div>
                    </div>
                    <div className="h-[500px] border border-[var(--border)] rounded-xl overflow-hidden relative z-0">
                        <LocationPickerMap latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))} />
                    </div>
                </div>
            );
            case 'media': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center bg-[var(--background)] hover:bg-[var(--accent)]/5 transition-all cursor-pointer relative group">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploading} />
                        <div className="w-16 h-16 rounded-full bg-[var(--card)] shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {uploading ? <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" /> : <div className="text-3xl text-[var(--primary)] leading-none pb-1">+</div>}
                        </div>
                        <h4 className="font-semibold text-lg text-[var(--foreground)]">Kéo thả hoặc chọn ảnh</h4>
                        <p className="text-sm text-[var(--muted-foreground)] mt-2">Tối đa 10 ảnh. Định dạng JPG, PNG.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {form.imageUrls.map((url, i) => (
                            <div key={i} className="aspect-square rounded-xl border border-[var(--border)] overflow-hidden relative group">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, x) => x !== i) }))}
                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 flex items-center justify-center shadow-sm">
                                    <span className="text-base leading-none pb-0.5">×</span>
                                </button>
                                {i === 0 && <span className="absolute bottom-2 left-2 px-2 py-1 bg-[var(--primary)] text-white text-[10px] font-bold rounded uppercase">Ảnh bìa</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'detail': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        {renderInput("Phòng ngủ", "bedrooms", "number")}
                        {renderInput("Phòng tắm", "bathrooms", "number")}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Hướng</label>
                            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]">
                                <option value="">-- Chọn hướng --</option>
                                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">Pháp lý</label>
                            <select value={form.legalStatus} onChange={e => setForm(f => ({ ...f, legalStatus: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]">
                                <option value="">-- Chọn pháp lý --</option>
                                {LEGAL_STATUSES.map(l => <option key={l.value} value={l.label}>{l.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--foreground)]">Tiện ích</label>
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES_LIST.map(item => {
                                const selected = form.amenities.includes(item);
                                return (
                                    <button key={item} onClick={() => setForm(f => ({ ...f, amenities: selected ? f.amenities.filter(x => x !== item) : [...f.amenities, item] }))}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selected ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30'}`}>
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
            case 'contact': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-[var(--primary)]/10 p-4 rounded-xl border border-[var(--primary)]/20 text-sm text-[var(--primary)] flex gap-3">
                        <div>
                            <p className="font-semibold">Thông tin liên hệ</p>
                            <p className="opacity-80 mt-1">Thông tin này sẽ được hiển thị công khai để người mua liên hệ với bạn.</p>
                        </div>
                    </div>
                    {renderInput("Tên liên hệ", "contactName", "text", "", true)}
                    {renderInput("Số điện thoại", "contactPhone", "tel", "", true)}
                    {renderInput("Email", "contactEmail", "email")}
                </div>
            );
            default: return null;
        }
    };

    if (status === "loading") return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    if (status === "unauthenticated") return null;

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Header - Local header for listing actions */}
            <header className="sticky top-0 left-0 right-0 h-16 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 lg:px-6 flex items-center justify-between z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/moi-gioi/tin-dang" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--accent)]/10 text-[var(--muted-foreground)] transition-colors font-bold text-lg">
                        ←
                    </Link>
                    <div>
                        <h1 className="font-bold text-[var(--foreground)] leading-tight">{editId ? 'Chỉnh sửa tin' : 'Đăng tin mới'}</h1>
                        <p className="text-xs text-slate-500 hidden sm:block">Hoàn tất các bước để đăng tải</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleSave(true)} disabled={isSaving} className="hidden sm:flex px-4 py-2 border border-[var(--border)] text-[var(--muted-foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--accent)]/10">
                        {isSaving ? "..." : "Lưu nháp"}
                    </button>
                    <button onClick={() => handleSave(false)} disabled={isSaving} className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2">
                        {isSaving ? "Đang xử lý..." : "Đăng tin"}
                    </button>
                </div>
            </header>

            {/* Main Layout - Standard Window Scroll */}
            <div className="flex-1 flex items-start max-w-[1920px] mx-auto w-full">
                {/* Left Sidebar - Stepper (Desktop) - Sticky */}
                <div className="hidden lg:flex flex-col w-64 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto bg-[var(--card)] border-r border-[var(--border)] p-6 gap-2">
                    {STEPS.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isPast = STEPS.findIndex(s => s.id === currentStep) > idx;
                        return (
                            <button key={step.id} onClick={() => setCurrentStep(step.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all text-left group ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/10'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none transition-colors font-bold text-xs ${isActive ? 'bg-[var(--primary)] text-white' : isPast ? 'bg-green-100 text-green-700' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                                    {idx + 1}
                                </div>
                                <span className={isActive ? 'font-bold' : ''}>{step.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Center - Form Area - Natural Growth */}
                <div className="flex-1 p-4 sm:p-8 min-w-0">
                    <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
                        <div className="mb-6 pb-4 border-b border-[var(--border)] lg:hidden">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm">{STEPS.findIndex(s => s.id === currentStep) + 1}</span>
                                {STEPS.find(s => s.id === currentStep)?.label}
                            </h2>
                        </div>

                        {/* Smart Fill Section (Inline) */}
                        {showSmartFill && currentStep === 'basic' && (
                            <div className="mb-8 p-6 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5 rounded-2xl border border-[var(--primary)]/20 shadow-sm relative overflow-hidden group animate-fade-in">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-24 h-24 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                                                <span className="text-xl">✨</span> Điền tin nhanh bằng AI
                                            </h3>
                                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Dán nội dung hoặc nhấn nút 🎤 để ghi giọng nói, AI sẽ tự động điền các trường cho bạn.</p>
                                        </div>
                                        <button onClick={() => setShowSmartFill(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 text-2xl leading-none">×</button>
                                    </div>
                                    <textarea
                                        value={smartFillText}
                                        onChange={e => setSmartFillText(e.target.value)}
                                        placeholder='VD: "Bán nhà mặt tiền đường 3/2 quận 10, diện tích 5x20m, 1 trệt 3 lầu, giá 15 tỷ thương lượng..."'
                                        className="w-full h-24 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none text-sm mb-3"
                                    />
                                    {isRecording && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm mb-2 animate-pulse">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                            Đang nghe... Hãy nói thông tin bất động sản của bạn
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleVoiceRecording}
                                                disabled={isSmartFilling}
                                                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${isRecording
                                                    ? 'bg-red-500 text-white animate-pulse'
                                                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                                                    }`}
                                            >
                                                <span className={isRecording ? 'animate-pulse' : ''}>🎤</span>
                                                {isRecording ? 'Đang ghi...' : 'Ghi giọng nói'}
                                            </button>
                                            {smartFillText.trim().length > 0 && (
                                                <button
                                                    onClick={handleSmartFill}
                                                    disabled={isSmartFilling}
                                                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold hover:brightness-110 shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2"
                                                >
                                                    {isSmartFilling ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "⚡"}
                                                    {isSmartFilling ? "Đang phân tích..." : "Điền tự động"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderStepContent()}

                        {/* Mobile Navigation */}
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--border)] p-4 flex gap-3 z-10 safe-area-bottom">
                            <button onClick={() => setCurrentStep(STEPS[Math.max(0, STEPS.findIndex(s => s.id === currentStep) - 1)].id)}
                                disabled={currentStep === 'basic'}
                                className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--foreground)] disabled:opacity-50">Trước</button>
                            <button onClick={() => {
                                const idx = STEPS.findIndex(s => s.id === currentStep);
                                if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
                                else handleSave(false);
                            }} className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-bold shadow-lg shadow-[var(--primary)]/30">
                                {currentStep === 'contact' ? 'Đăng tin' : 'Tiếp theo'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right - Live Preview (Desktop Only) - Sticky */}
                <div className="hidden xl:block w-[400px] sticky top-20 h-[calc(100vh-80px)] overflow-y-auto bg-[var(--card)] border-l border-[var(--border)] p-6">
                    <div className="sticky top-0">
                        <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">Xem trước tin đăng</h3>
                        <div className="bg-[var(--card)] rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] sticky top-0">
                            <div className="aspect-video bg-[var(--muted)] relative group overflow-hidden">
                                {form.imageUrls[0] ? (
                                    <img src={form.imageUrls[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] text-sm gap-2">
                                        <span className="text-4xl opacity-20">📷</span>
                                        <span>Chưa có ảnh</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                                    {form.category ? CATEGORIES.find(c => c.value === form.category)?.label : "Đang cập nhật"}
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-lg text-xs backdrop-blur-md font-medium">
                                    {form.imageUrls.length} ảnh
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="text-xl font-bold text-red-600 dark:text-red-500">
                                    {form.price ? (form.price.length >= 10 ? formatPrice(Number(form.price)) : (Number(form.price) >= 1000000 ? formatPrice(Number(form.price)) : form.price)) : "Giá liên hệ"}
                                    {form.listingType === 'RENT' && <span className="text-sm font-normal text-[var(--muted-foreground)]"> / tháng</span>}
                                </div>
                                <h4 className="font-bold text-[var(--foreground)] line-clamp-2 leading-snug text-lg">
                                    {form.title || "Tiêu đề tin đăng sẽ hiện ở đây"}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                    <span>{form.districtId ? "Quận/Huyện" : "Khu vực"}</span>
                                    <span>•</span>
                                    <span>{form.area || 0} m²</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-medium">
                                    <span className="flex items-center gap-1"><span className="text-sm">🛏</span> {form.bedrooms || 0} PN</span>
                                    <span className="flex items-center gap-1"><span className="text-sm">🚿</span> {form.bathrooms || 0} WC</span>
                                    <span className="flex items-center gap-1"><span className="text-sm">🧭</span> {form.direction || "Hướng"}</span>
                                </div>
                                <div className="pt-4 border-t border-[var(--border)] mt-2 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm ring-2 ring-[var(--background)]">
                                        {form.contactName?.[0] || "U"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[var(--foreground)]">{form.contactName || "Tên liên hệ"}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">Đăng hôm nay</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold hover:bg-[var(--primary)] hover:text-white transition-colors">
                                        Nhắn tin
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-5 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5 rounded-2xl border border-[var(--primary)]/20 shadow-sm">
                            <h4 className="font-bold text-[var(--primary)] text-sm mb-3 flex items-center gap-2">
                                <span className="text-lg">✨</span> Mẹo tối ưu từ AI
                            </h4>
                            <div className="space-y-2">
                                {form.imageUrls.length < 3 && (
                                    <p className="text-xs text-[var(--muted-foreground)] flex gap-2">
                                        <span className="text-[var(--warning)]">⚠️</span>
                                        Thêm ít nhất 3 ảnh để tăng 40% lượt xem.
                                    </p>
                                )}
                                {(!form.description || form.description.length < 100) && (
                                    <p className="text-xs text-[var(--muted-foreground)] flex gap-2">
                                        <span className="text-[var(--primary)]">ℹ️</span>
                                        Mô tả chi tiết giúp khách hàng hiểu rõ hơn.
                                    </p>
                                )}
                                {!form.price && (
                                    <p className="text-xs text-[var(--muted-foreground)] flex gap-2">
                                        <span className="text-[var(--destructive)]">ℹ️</span>
                                        Tin đăng có giá rõ ràng thường được quan tâm hơn.
                                    </p>
                                )}
                                {form.imageUrls.length >= 3 && form.description.length >= 100 && form.price && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex gap-2 font-medium">
                                        <span>✅</span> Tin đăng của bạn đang rất tốt!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* AI Modal (Description Generator) */}
            {showAi && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card)] rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--border)] overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                            <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">✨ AI Content Generator</h3>
                            <button onClick={() => setShowAi(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none">
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Tone giọng</label>
                                    <select value={aiTone} onChange={e => setAiTone(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]/20 outline-none">
                                        <option value="chuyên nghiệp">Chuyên nghiệp</option>
                                        <option value="thân thiện">Thân thiện</option>
                                        <option value="hấp dẫn">Hấp dẫn/Thuyết phục</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Khách hàng mục tiêu</label>
                                    <input value={aiTarget} onChange={e => setAiTarget(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" placeholder="VD: Gia đình trẻ..." />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Từ khóa nổi bật</label>
                                <input value={aiKeys} onChange={e => setAiKeys(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" placeholder="Gần chợ, trường học, có hồ bơi..." />
                            </div>

                            <button onClick={handleAiGenerate} disabled={aiGenerating} className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition-all flex justify-center items-center gap-2">
                                {aiGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>✨ Tạo nội dung ngay</>}
                            </button>

                            {(aiResult || aiTitle) && (
                                <div className="mt-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] animate-slide-up">
                                    {aiTitle && <div className="font-bold text-[var(--foreground)] mb-2 pb-2 border-b border-[var(--border)]">{aiTitle}</div>}
                                    <div className="text-sm text-[var(--foreground)] max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed opacity-90">{aiResult}</div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => setShowAi(false)} className="flex-1 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--muted)] transition-colors">Đóng</button>
                                        <button onClick={() => {
                                            setForm(f => ({ ...f, description: aiResult, title: aiTitle || f.title }));
                                            setShowAi(false);
                                        }} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">Áp dụng</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Logic */}
            {notice && (
                <>
                    {notice.type === 'success' ? (
                        /* Success Modal (Popup) */
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                            <div className="bg-[var(--card)] rounded-3xl w-full max-w-sm shadow-2xl border border-[var(--border)] overflow-hidden animate-scale-in text-center p-8">
                                <div className="mb-6 relative h-24 w-24 mx-auto">
                                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
                                    <div className="relative z-10 w-full h-full bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl shadow-lg shadow-emerald-500/40">
                                        ✓
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-[var(--foreground)] mb-2 tracking-tight">Thành công!</h3>
                                <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed px-4">
                                    {notice.message}
                                </p>
                                <button
                                    onClick={() => setNotice(null)}
                                    className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                >
                                    Tuyệt vời
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Other Notifications (Toast) */
                        <div className={`fixed bottom-6 right-6 px-6 py-5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border flex items-center gap-5 z-[100] animate-slide-up max-w-sm ${notice.type === 'error'
                            ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
                            : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
                            }`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notice.type === 'error'
                                ? 'bg-red-600 dark:bg-red-700 text-white'
                                : 'bg-blue-600 dark:bg-blue-700 text-white'
                                }`}>
                                {notice.type === 'error' ? (
                                    <span className="text-xl font-bold">✕</span>
                                ) : (
                                    <span className="text-xl font-bold">ℹ</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">{notice.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo'}</h4>
                                <p className="text-sm font-medium leading-snug text-slate-600 dark:text-slate-400">{notice.message}</p>
                            </div>
                            <button
                                onClick={() => setNotice(null)}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xl font-light text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
