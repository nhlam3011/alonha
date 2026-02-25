import { NextResponse } from "next/server";
import { callGeminiChat } from "@/lib/ai";
import { detectProvinceInKeyword as detectProvinceFromLib } from "@/lib/provinces";

type ListingType = "sale" | "rent";

type IntentFilters = {
  keyword?: string | null;
  loaiHinh?: ListingType | null;
  category?: string | null; // slug: can-ho-chung-cu, nha-rieng, dat-nen...
  priceMin?: number | null;
  priceMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  bedrooms?: number | null;
  province?: string | null; // Tên tỉnh/thành phố
  district?: string | null; // Tên quận/huyện
};

type IntentResponse = {
  filters?: IntentFilters;
  explanation?: string;
};

type SearchIntentBody = {
  query?: unknown;
};

const ALLOWED_CATEGORY_SLUGS = new Set([
  "can-ho-chung-cu",
  "nha-rieng",
  "nha-mat-phong",
  "dat-nen",
  "kho-nha-xuong",
  "biet-thu",
  "van-phong",
  "mat-bang",
  "bds-khac",
]);

const BEDROOM_WORD_TO_NUMBER: Record<string, number> = {
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
  muoi: 10,
};

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategorySlug(value: unknown): IntentFilters["category"] {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return ALLOWED_CATEGORY_SLUGS.has(slug) ? slug : null;
}

function toRoundedPositiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

function normalizeForPriceMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\s.,\-~]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLocaleNumber(raw: string): number | null {
  const value = raw.replace(/\s+/g, "").trim();
  if (!value) return null;

  let normalized = value;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");
    const decimalDigits = parts.length === 2 ? parts[1].length : 0;
    if (parts.length > 2 || decimalDigits === 3) {
      normalized = normalized.replace(/\./g, "");
    }
  }

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function unitMultiplier(unit: string): number {
  const normalized = normalizeForMatch(unit);
  return normalized === "trieu" || normalized === "tr" ? 1e6 : 1e9;
}

function toVnd(valueRaw: string, unitRaw: string): number | null {
  const amount = parseLocaleNumber(valueRaw);
  if (amount == null) return null;
  return Math.round(amount * unitMultiplier(unitRaw));
}

function normalizeRange(minValue: number | null, maxValue: number | null): Pick<IntentFilters, "priceMin" | "priceMax"> {
  if (minValue != null && maxValue != null) {
    if (minValue <= maxValue) {
      return { priceMin: minValue, priceMax: maxValue };
    }
    return { priceMin: maxValue, priceMax: minValue };
  }
  return { priceMin: minValue, priceMax: maxValue };
}

function extractPriceRangeFromQuery(query: string): Pick<IntentFilters, "priceMin" | "priceMax"> {
  const normalized = normalizeForPriceMatch(query);
  if (!/\d+(?:[.,]\d+)?\s*(?:ty|ti|trieu|tr)\b/i.test(normalized)) {
    return { priceMin: null, priceMax: null };
  }

  const sameUnitRange = normalized.match(
    /\b(?:tu\s*)?(\d+(?:[.,]\d+)?)\s*(?:-|den|toi|~)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\b/i,
  );
  if (sameUnitRange?.[1] && sameUnitRange[2] && sameUnitRange[3]) {
    const minValue = toVnd(sameUnitRange[1], sameUnitRange[3]);
    const maxValue = toVnd(sameUnitRange[2], sameUnitRange[3]);
    return normalizeRange(minValue, maxValue);
  }

  const dualUnitRange = normalized.match(
    /\b(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\s*(?:-|den|toi|~)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)?\b/i,
  );
  if (dualUnitRange?.[1] && dualUnitRange[2] && dualUnitRange[3]) {
    const unitForRight = dualUnitRange[4] || dualUnitRange[2];
    const minValue = toVnd(dualUnitRange[1], dualUnitRange[2]);
    const maxValue = toVnd(dualUnitRange[3], unitForRight);
    return normalizeRange(minValue, maxValue);
  }

  const upperBySuffix = normalized.match(
    /\b(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\s*(?:tro\s*xuong|do\s*lai)\b/i,
  );
  if (upperBySuffix?.[1] && upperBySuffix[2]) {
    return { priceMin: null, priceMax: toVnd(upperBySuffix[1], upperBySuffix[2]) };
  }

  const upperBound = normalized.match(
    /\b(?:duoi|toi\s*da|khong\s*qua|nho\s*hon|it\s*hon)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\b/i,
  );
  if (upperBound?.[1] && upperBound[2]) {
    return { priceMin: null, priceMax: toVnd(upperBound[1], upperBound[2]) };
  }

  const lowerBySuffix = normalized.match(
    /\b(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\s*(?:tro\s*len)\b/i,
  );
  if (lowerBySuffix?.[1] && lowerBySuffix[2]) {
    return { priceMin: toVnd(lowerBySuffix[1], lowerBySuffix[2]), priceMax: null };
  }

  const lowerBound = normalized.match(
    /\b(?:tren|hon|tu|it\s*nhat|toi\s*thieu)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\b/i,
  );
  if (lowerBound?.[1] && lowerBound[2]) {
    return { priceMin: toVnd(lowerBound[1], lowerBound[2]), priceMax: null };
  }

  const aroundPrice = normalized.match(
    /\b(?:tam|khoang|quanh|gan|xap\s*xi)\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\b/i,
  );
  if (aroundPrice?.[1] && aroundPrice[2]) {
    const base = toVnd(aroundPrice[1], aroundPrice[2]);
    if (base == null) return { priceMin: null, priceMax: null };
    return normalizeRange(Math.round(base * 0.9), Math.round(base * 1.1));
  }

  const singlePrice = normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu|tr)\b/i);
  if (singlePrice?.[1] && singlePrice[2]) {
    const base = toVnd(singlePrice[1], singlePrice[2]);
    if (base == null) return { priceMin: null, priceMax: null };
    return normalizeRange(Math.round(base * 0.9), Math.round(base * 1.1));
  }

  return { priceMin: null, priceMax: null };
}

function parseBedroomNumber(raw: string): number | null {
  const normalized = normalizeForMatch(raw);
  const numeric = Number.parseInt(normalized, 10);
  const value = Number.isFinite(numeric) ? numeric : BEDROOM_WORD_TO_NUMBER[normalized];
  if (!value || value < 1 || value > 20) return null;
  return value;
}

function extractBedroomsFromQuery(query: string): number | null {
  const normalized = normalizeForMatch(query);

  const valueFirstMatch = normalized.match(
    /\b(\d{1,2}|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s*(?:pn|phong\s*ngu|phong(?!\s*(?:tam|wc|ve\s*sinh))|ngu|bed(?:room)?s?|br)\b/i,
  );
  if (valueFirstMatch?.[1]) {
    return parseBedroomNumber(valueFirstMatch[1]);
  }

  const unitFirstMatch = normalized.match(
    /\b(?:pn|phong\s*ngu|phong(?!\s*(?:tam|wc|ve\s*sinh))|ngu|bed(?:room)?s?|br)\s*(\d{1,2}|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\b/i,
  );
  if (unitFirstMatch?.[1]) {
    return parseBedroomNumber(unitFirstMatch[1]);
  }

  return null;
}

function inferListingType(query: string): ListingType | null {
  const normalized = normalizeForMatch(query);
  const hasRentIntent = /\b(thue|muon\s*thue|can\s*thue|tim\s*thue)\b/i.test(normalized);
  const hasSaleIntent = /\b(mua|ban|can\s*mua|tim\s*mua|so\s*huu)\b/i.test(normalized);

  if (hasRentIntent && !hasSaleIntent) return "rent";
  if (hasSaleIntent && !hasRentIntent) return "sale";
  return null;
}

function inferCategory(query: string): IntentFilters["category"] {
  const normalized = normalizeForMatch(query);

  if (/\b(can\s*ho|chung\s*cu|cc\s*mini|apartment|studio)\b/i.test(normalized)) return "can-ho-chung-cu";
  if (/\b(biet\s*thu|villa)\b/i.test(normalized)) return "biet-thu";
  if (/\b(nha\s*mat\s*pho|nha\s*pho|mat\s*tien|shophouse)\b/i.test(normalized)) return "nha-mat-phong";
  if (/\b(nha\s*rieng)\b/i.test(normalized)) return "nha-rieng";
  if (/\b(dat\s*nen)\b/i.test(normalized)) return "dat-nen";
  if (/\b(van\s*phong|office)\b/i.test(normalized)) return "van-phong";
  if (/\b(mat\s*bang|shophouse|shop\s*house)\b/i.test(normalized)) return "mat-bang";
  if (/\b(kho|nha\s*xuong|xuong)\b/i.test(normalized)) return "kho-nha-xuong";
  if (/\bnha\s*dat\b/i.test(normalized)) return null;
  if (/\bdat\b/i.test(normalized)) return "dat-nen";

  return null;
}

/**
 * Bản đồ viết tắt / không dấu -> tên quận/huyện chuẩn (có dấu)
 * Dùng cho heuristic fallback phổ biến nhất
 * (Quận/huyện không có trong API v2, nên vẫn giữ hardcode)
 */
const DISTRICT_ALIAS_MAP: Record<string, string> = {
  "quan 1": "Quận 1",
  "q1": "Quận 1",
  "quan 2": "Quận 2",
  "q2": "Quận 2",
  "quan 3": "Quận 3",
  "q3": "Quận 3",
  "quan 4": "Quận 4",
  "q4": "Quận 4",
  "quan 5": "Quận 5",
  "q5": "Quận 5",
  "quan 6": "Quận 6",
  "q6": "Quận 6",
  "quan 7": "Quận 7",
  "q7": "Quận 7",
  "quan 8": "Quận 8",
  "q8": "Quận 8",
  "quan 9": "Quận 9",
  "q9": "Quận 9",
  "quan 10": "Quận 10",
  "q10": "Quận 10",
  "quan 11": "Quận 11",
  "q11": "Quận 11",
  "quan 12": "Quận 12",
  "q12": "Quận 12",
  "thu duc": "Thủ Đức",
  "tp thu duc": "Thủ Đức",
  "binh thanh": "Bình Thạnh",
  "go vap": "Gò Vấp",
  "phu nhuan": "Phú Nhuận",
  "tan binh": "Tân Bình",
  "tan phu": "Tân Phú",
  "binh tan": "Bình Tân",
  "binh chanh": "Bình Chánh",
  "hoc mon": "Hóc Môn",
  "cu chi": "Củ Chi",
  "nha be": "Nhà Bè",
  "can gio": "Cần Giờ",
  "cau giay": "Cầu Giấy",
  "dong da": "Đống Đa",
  "ba dinh": "Ba Đình",
  "hoan kiem": "Hoàn Kiếm",
  "hai ba trung": "Hai Bà Trưng",
  "thanh xuan": "Thanh Xuân",
  "hoang mai": "Hoàng Mai",
  "long bien": "Long Biên",
  "tay ho": "Tây Hồ",
  "ha dong": "Hà Đông",
  "nam tu liem": "Nam Từ Liêm",
  "bac tu liem": "Bắc Từ Liêm",
  "thanh tri": "Thanh Trì",
  "gia lam": "Gia Lâm",
  "dong anh": "Đông Anh",
  "soc son": "Sóc Sơn",
  "hai chau": "Hải Châu",
  "thanh khe": "Thanh Khê",
  "son tra": "Sơn Trà",
  "ngu hanh son": "Ngũ Hành Sơn",
  "lien chieu": "Liên Chiểu",
  "cam le": "Cẩm Lệ",
};

/**
 * Phát hiện tỉnh/thành và quận/huyện trong câu query không dấu.
 * Tỉnh/thành: dùng lib chung (dynamic từ API).
 * Quận/huyện: vẫn dùng DISTRICT_ALIAS_MAP (không có trong API v2).
 */
async function inferProvinceAndDistrict(query: string): Promise<{ province: string | null; district: string | null }> {
  const normalized = normalizeForMatch(query);
  let province: string | null = null;
  let district: string | null = null;

  // Tỉnh/thành: detect qua lib chung
  const detection = await detectProvinceFromLib(query);
  if (detection) {
    // Bỏ prefix "Tỉnh "/"Thành phố " để trả về tên ngắn cho AI search
    province = detection.provinceName
      .replace(/^(Tỉnh|Thành phố)\s+/i, "")
      .trim();
  }

  // Quận/huyện: vẫn dùng hardcode vì API v2 không có district
  const sortedDistricts = Object.entries(DISTRICT_ALIAS_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [alias, name] of sortedDistricts) {
    const regex = new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`, "i");
    if (regex.test(normalized)) {
      district = name;
      break;
    }
  }

  return { province, district };
}

function stripCategoryPhraseInKeyword(keyword: string, category: IntentFilters["category"]): string {
  let cleaned = keyword.normalize("NFC");

  if (category === "can-ho-chung-cu") {
    cleaned = cleaned.replace(/\b(căn\s*hộ|can\s*ho|chung\s*cư|chung\s*cu|cc\s*mini|apartment|studio)\b/giu, " ");
  } else if (category === "nha-mat-phong") {
    cleaned = cleaned.replace(/\b(nhà\s*mặt\s*phố|nha\s*mat\s*pho|nhà\s*phố|nha\s*pho|mặt\s*tiền|mat\s*tien|shophouse)\b/giu, " ");
  } else if (category === "nha-rieng") {
    cleaned = cleaned.replace(/\b(nhà\s*riêng|nha\s*rieng)\b/giu, " ");
  } else if (category === "dat-nen") {
    cleaned = cleaned.replace(/\b(đất\s*nền|dat\s*nen|đất|dat)\b/giu, " ");
  } else if (category === "biet-thu") {
    cleaned = cleaned.replace(/\b(biệt\s*thự|biet\s*thu|villa)\b/giu, " ");
  } else if (category === "van-phong") {
    cleaned = cleaned.replace(/\b(văn\s*phòng|van\s*phong|office)\b/giu, " ");
  } else if (category === "mat-bang") {
    cleaned = cleaned.replace(/\b(mặt\s*bằng|mat\s*bang|shophouse|shop\s*house)\b/giu, " ");
  } else if (category === "kho-nha-xuong") {
    cleaned = cleaned.replace(/\b(kho|nhà\s*xưởng|nha\s*xuong|xưởng|xuong)\b/giu, " ");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

function cleanupKeyword(query: string): string | null {
  let cleaned = query.normalize("NFC");
  cleaned = cleaned.replace(
    /\b(\d{1,2}|một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\s*(?:phòng\s*ngủ|phong\s*ngu|phòng(?!\s*(?:tắm|tam|wc|vệ\s*sinh|ve\s*sinh))|phong(?!\s*(?:tam|wc|ve\s*sinh))|pn|ngủ|ngu|bed(?:room)?s?|br)\b/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /\b(?:phòng\s*ngủ|phong\s*ngu|phòng(?!\s*(?:tắm|tam|wc|vệ\s*sinh|ve\s*sinh))|phong(?!\s*(?:tam|wc|ve\s*sinh))|pn|ngủ|ngu|bed(?:room)?s?|br)\s*(\d{1,2}|một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\b/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /(?:từ|tu)?\s*\d+(?:[.,]\d+)?\s*(?:-|đến|den|tới|toi)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|ti|triệu|tr)(?=\s|$)/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /(?:dưới|duoi|trên|tren|từ|tu|hơn|hon|ít\s*nhất|it\s*nhat|không\s*quá|khong\s*qua|tầm|tam|khoảng|khoang|quanh|gần|gan)\s*\d+(?:[.,]\d+)?\s*(?:tỷ|ty|ti|triệu|tr)(?=\s|$)/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /\d+(?:[.,]\d+)?\s*(?:tỷ|ty|ti|triệu|tr)\s*(?:trở\s*xuống|tro\s*xuong|đổ\s*lại|do\s*lai|trở\s*lên|tro\s*len)?(?=\s|$)/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /\b(cần|tìm|tim|muốn|muon|mua|thuê|thue|bán|ban|ở|o|tại|tai)\b/giu,
    " ",
  );
  cleaned = cleaned.replace(
    /\b(?:dưới|duoi|trên|tren|từ|tu|đến|den|tới|toi|hơn|hon|ít\s*nhất|it\s*nhat|không\s*quá|khong\s*qua|tầm|tam|khoảng|khoang|quanh|gần|gan)\b/giu,
    " ",
  );
  cleaned = cleaned.replace(/\b\d+(?:[.,]\d+)?\s*-\s*/gu, " ");
  cleaned = cleaned.replace(/\s*-\s*/g, " ");
  cleaned = cleaned.replace(/\bq\s*(\d{1,2})\b/giu, "quan $1");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned.length >= 2 ? cleaned : null;
}

async function extractHeuristicFilters(query: string): Promise<IntentFilters> {
  const category = inferCategory(query);
  const priceRange = extractPriceRangeFromQuery(query);
  const { province, district } = await inferProvinceAndDistrict(query);
  const cleanedKeywordBase = cleanupKeyword(query);
  const cleanedKeyword =
    cleanedKeywordBase && category
      ? stripCategoryPhraseInKeyword(cleanedKeywordBase, category)
      : cleanedKeywordBase;
  const keyword = cleanedKeyword && cleanedKeyword.length >= 2 ? cleanedKeyword : null;
  return {
    keyword,
    loaiHinh: inferListingType(query),
    category,
    bedrooms: extractBedroomsFromQuery(query),
    priceMin: priceRange.priceMin,
    priceMax: priceRange.priceMax,
    province,
    district,
  };
}

export async function POST(req: Request) {
  const body: SearchIntentBody = await req.json().catch(() => ({}));
  const query = String(body.query ?? "").trim().slice(0, 400);

  if (!query) {
    return NextResponse.json({ error: "Thiếu nội dung mô tả nhu cầu tìm kiếm." }, { status: 400 });
  }

  const heuristicFilters = await extractHeuristicFilters(query);
  const hasHeuristicStructuredFilter = Boolean(
    heuristicFilters.loaiHinh ||
    heuristicFilters.category ||
    heuristicFilters.bedrooms ||
    heuristicFilters.priceMin ||
    heuristicFilters.priceMax ||
    heuristicFilters.province ||
    heuristicFilters.district,
  );
  const baseFilters: IntentFilters = {
    keyword: heuristicFilters.keyword ?? (hasHeuristicStructuredFilter ? null : query),
  };

  try {
    const systemPrompt = `Bạn là trợ lý AI cho nền tảng bất động sản Alonha tại Việt Nam. Nhiệm vụ là phân tích câu mô tả nhu cầu của khách (tiếng Việt) và trích xuất các bộ lọc tìm kiếm cấu trúc. Chỉ làm việc với nhà đất tại Việt Nam.

QUAN TRỌNG: Bạn PHẢI hiểu được câu KHÔNG DẤU và KHÔNG PHÂN BIỆT CHỮ HOA/THƯỜNG. Ví dụ:
- "can ho ha noi" hoặc "CAN HO HA NOI" hoặc "Căn Hộ Hà Nội" -> đều hiểu là căn hộ tại Hà Nội
- "quan 7" hoặc "QUAN 7" hoặc "Quận 7" -> đều hiểu là Quận 7
- "nha rieng" hoặc "NHA RIENG" -> đều hiểu là nhà riêng

QUAN TRỌNG VỀ TỪ VIẾT TẮT ĐỊA ĐIỂM:
Bạn PHẢI tự động nhận diện và chuyển đổi các từ viết tắt phổ biến về tên đầy đủ:
- "HCM" hoặc "hcm" hoặc "HCM" -> "Hồ Chí Minh" (TP.HCM, thành phố Hồ Chí Minh)
- "HN" hoặc "hn" hoặc "Ha Noi" -> "Hà Nội"
- "DN" hoặc "dn" hoặc "Da Nang" -> "Đà Nẵng"
- "HP" hoặc "hp" -> "Hải Phòng"
- "CT" hoặc "ct" -> "Cần Thơ"
- "Q1", "Q2", "Q3"... -> "Quận 1", "Quận 2", "Quận 3"...
- "TP" hoặc "tp" -> có thể là "Thành phố" (cần ngữ cảnh)

Luôn tự động chuẩn hóa tên địa điểm về dạng có dấu CHUẨN tiếng Việt trong kết quả.`;

    const userPrompt = `
Khách mô tả nhu cầu tìm bất động sản như sau (tiếng Việt, có thể KHÔNG DẤU hoặc viết hoa/thường tùy ý):
"""${query}"""

Hãy:
1. Hiểu rõ nhu cầu: mua/thuê (sale/rent), loại BĐS, tầm giá, diện tích, số phòng ngủ, VỊ TRÍ (Tỉnh/Thành, Quận/Huyện).
2. Quy đổi về bộ lọc chuẩn theo format JSON bên dưới.

YÊU CẦU:
- Chỉ trả về JSON, KHÔNG kèm giải thích bên ngoài.
- Hiểu được cách nói tắt/phổ thông của người dùng, ví dụ:
  - "2 ngủ", "2pn", "pn 2", "2 phòng" => bedrooms = 2
- HIỂU ĐƯỢC CÂU KHÔNG DẤU: "can ho ha noi" = "căn hộ Hà Nội", "quan 7" = "Quận 7"
- HIỂU ĐƯỢC CÂU KHÔNG PHÂN BIỆT HOA/THƯỜNG: "CAN HO" = "can ho" = "Căn Hộ"
- Các trường số (priceMin, priceMax, areaMin, areaMax, bedrooms) là số nguyên, đơn vị:
  - Nếu người dùng chỉ nêu một con số giá (ví dụ: "5 tỷ", "tầm 3 tỷ", "khoảng 7 tỷ") thì hãy hiểu đó là KHOẢNG GIÁ XUNG QUANH GIÁ ĐÓ, KHÔNG phải giá cố định:
    - priceMin ≈ 0.9 * giá
    - priceMax ≈ 1.1 * giá
    (Ví dụ: 5 tỷ → priceMin ≈ 4500000000, priceMax ≈ 5500000000)
  - Nếu người dùng nói rõ "từ X đến Y" thì hãy dùng trực tiếp X–Y làm priceMin/priceMax.
  - priceMin/priceMax: tính bằng VNĐ (VND). Ví dụ: 3 tỷ = 3000000000.
  - areaMin/areaMax: m².
- loaiHinh: chỉ nhận 'sale' (mua/bán) hoặc 'rent' (thuê). Nếu không rõ, để null.
- category (slug) phải thuộc một trong:
  - 'can-ho-chung-cu' (căn hộ, chung cư, can ho, chung cu, CAN HO, CHUNG CU)
  - 'nha-rieng' (nhà riêng, nha rieng, NHA RIENG)
  - 'nha-mat-phong' (nhà mặt phố, nha mat pho, NHA MAT PHO)
  - 'dat-nen' (đất nền, dat nen, DAT NEN)
  - 'kho-nha-xuong' (kho nhà xưởng, kho nha xuong)
  - 'biet-thu' (biệt thự, biet thu, BIET THU)
  - 'van-phong' (văn phòng, van phong, VAN PHONG)
  - 'mat-bang' (mặt bằng, mat bang, MAT BANG)
  - 'bds-khac' (bất động sản khác)
  Nếu không xác định được rõ, dùng null.
- province: Tên tỉnh/thành phố CHUẨN TIẾNG VIỆT (có dấu, viết hoa). 
  Ví dụ: 
  - "ha noi" hoặc "HN" -> "Hà Nội"
  - "hcm" hoặc "HCM" hoặc "ho chi minh" hoặc "TP.HCM" -> "Hồ Chí Minh"
  - "da nang" hoặc "DN" -> "Đà Nẵng"
  - "hai phong" hoặc "HP" -> "Hải Phòng"
  - "can tho" hoặc "CT" -> "Cần Thơ"
  Luôn chuyển đổi từ viết tắt về tên đầy đủ có dấu.
- district: Tên quận/huyện CHUẨN TIẾNG VIỆT (có dấu). Ví dụ: "quan 1" -> "Quận 1", "thu duc" -> "Thủ Đức", "cau giay" -> "Cầu Giấy".
- keyword: cụm từ tìm kiếm ngắn gọn còn lại sau khi đã trích xuất các thông tin trên (ví dụ tên dự án, tên đường). Nếu đã trích xuất hết ý nghĩa vào các trường khác thì để null hoặc rỗng.

STRUCT JSON ĐẦU RA (ví dụ, bạn phải giữ đúng key):
{
  "filters": {
    "keyword": "tên đường hoặc dự án",
    "loaiHinh": "sale",
    "category": "can-ho-chung-cu",
    "priceMin": 3000000000,
    "priceMax": 5000000000,
    "areaMin": 60,
    "areaMax": 90,
    "bedrooms": 2,
    "province": "Hồ Chí Minh",
    "district": "Quận 7"
  },
  "explanation": "Mua căn hộ chung cư 2PN tại Quận 7, TP.HCM, tầm giá 3-5 tỷ, diện tích 60-90 m²."
}
`;

    const raw = await callGeminiChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 400 }
    );

    let jsonText = raw.trim();
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }

    const parsed = JSON.parse(jsonText) as IntentResponse;
    const f = parsed.filters ?? {};
    const aiKeyword = typeof f.keyword === "string" && f.keyword.trim() ? f.keyword.trim() : null;
    const aiLoaiHinh = f.loaiHinh === "sale" || f.loaiHinh === "rent" ? f.loaiHinh : null;
    const aiCategory = normalizeCategorySlug(f.category);
    const aiBedrooms = toRoundedPositiveInt(f.bedrooms);
    const aiPriceMin = toRoundedPositiveInt(f.priceMin);
    const aiPriceMax = toRoundedPositiveInt(f.priceMax);
    const aiAreaMin = toRoundedPositiveInt(f.areaMin);
    const aiAreaMax = toRoundedPositiveInt(f.areaMax);
    const aiProvince = typeof f.province === "string" && f.province.trim() ? f.province.trim() : null;
    const aiDistrict = typeof f.district === "string" && f.district.trim() ? f.district.trim() : null;

    const heuristicKeyword =
      typeof heuristicFilters.keyword === "string" && heuristicFilters.keyword.trim()
        ? heuristicFilters.keyword.trim()
        : null;
    const hasStructuredSignal = Boolean(
      aiLoaiHinh ||
      heuristicFilters.loaiHinh ||
      aiCategory ||
      heuristicFilters.category ||
      aiBedrooms ||
      heuristicFilters.bedrooms ||
      aiPriceMin ||
      aiPriceMax ||
      aiAreaMin ||
      aiAreaMax ||
      aiProvince ||
      aiDistrict,
    );
    const keyword =
      aiKeyword && heuristicKeyword && normalizeForMatch(aiKeyword) === normalizeForMatch(query)
        ? heuristicKeyword
        : (aiKeyword ?? heuristicKeyword ?? (hasStructuredSignal ? null : query));

    const filters: IntentFilters = {
      ...baseFilters,
      keyword,
      loaiHinh: aiLoaiHinh ?? heuristicFilters.loaiHinh ?? null,
      category: aiCategory ?? heuristicFilters.category ?? null,
      priceMin: aiPriceMin ?? heuristicFilters.priceMin ?? null,
      priceMax: aiPriceMax ?? heuristicFilters.priceMax ?? null,
      areaMin: aiAreaMin,
      areaMax: aiAreaMax,
      bedrooms: aiBedrooms ?? heuristicFilters.bedrooms ?? null,
      province: aiProvince,
      district: aiDistrict,
    };

    const explanation =
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : "Đã phân tích nhu cầu và gợi ý bộ lọc phù hợp.";

    return NextResponse.json({ filters, explanation });
  } catch {
    // Fallback: dùng heuristic local nếu AI lỗi/chưa cấu hình
    const hasStructuredFallback = Boolean(
      heuristicFilters.loaiHinh ||
      heuristicFilters.category ||
      heuristicFilters.bedrooms ||
      heuristicFilters.priceMin ||
      heuristicFilters.priceMax ||
      heuristicFilters.province ||
      heuristicFilters.district,
    );
    const filters: IntentFilters = {
      ...baseFilters,
      keyword: heuristicFilters.keyword ?? (hasStructuredFallback ? null : query),
      loaiHinh: heuristicFilters.loaiHinh ?? null,
      category: heuristicFilters.category ?? null,
      priceMin: heuristicFilters.priceMin ?? null,
      priceMax: heuristicFilters.priceMax ?? null,
      bedrooms: heuristicFilters.bedrooms ?? null,
      province: heuristicFilters.province ?? null,
      district: heuristicFilters.district ?? null,
    };

    return NextResponse.json({
      filters,
      explanation:
        "Không thể gọi AI, đã dùng phân tích từ khóa cục bộ.",
    });
  }
}

