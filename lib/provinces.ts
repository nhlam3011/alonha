/**
 * Centralized province / ward service.
 *
 * Dữ liệu được fetch từ https://provinces.open-api.vn/api/v2 (sau sáp nhập)
 * và cache trong bộ nhớ server (1 giờ) để tránh gọi API quá nhiều.
 *
 * Mọi nơi trong project cần danh sách tỉnh/thành, phường/xã,
 * hoặc detect tên tỉnh/quận trong keyword đều import từ file này.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw shape from https://provinces.open-api.vn/api/v2/p/ */
export type V2Province = {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
};

/** Raw shape from https://provinces.open-api.vn/api/v2/w/ */
export type V2Ward = {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const V2_PROVINCES_URL = "https://provinces.open-api.vn/api/v2/p/";
const V2_WARDS_URL = "https://provinces.open-api.vn/api/v2/w/";

/** Cache TTL – 1 hour (ms) */
const CACHE_TTL = 60 * 60 * 1000;

const FETCH_HEADERS = { "User-Agent": "alonha-app" };

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

type CacheEntry<T> = { data: T; ts: number };

let provincesCache: CacheEntry<V2Province[]> | null = null;
let wardsCache: CacheEntry<V2Ward[]> | null = null;
let aliasMapCache: CacheEntry<Map<string, { name: string; code: number }>> | null = null;

function isFresh(entry: CacheEntry<unknown> | null): boolean {
  return entry !== null && Date.now() - entry.ts < CACHE_TTL;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Bỏ dấu tiếng Việt, lowercase, đ -> d */
export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/**
 * Lấy danh sách tỉnh/thành phố từ API v2 (có cache 1 giờ).
 */
export async function getProvinces(): Promise<V2Province[]> {
  if (isFresh(provincesCache)) return provincesCache!.data;

  const res = await fetch(V2_PROVINCES_URL, {
    headers: FETCH_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    // Nếu đã có cache cũ thì trả về, dù hết hạn còn hơn lỗi
    const stale = provincesCache;
    if (stale) return stale.data;
    throw new Error(`Failed to fetch provinces: ${res.status}`);
  }

  const data: V2Province[] = await res.json();
  provincesCache = { data, ts: Date.now() };
  // Reset alias map vì dữ liệu gốc đã thay đổi
  aliasMapCache = null;
  return data;
}

/**
 * Lấy danh sách phường/xã từ API v2 (có cache 1 giờ).
 * Nếu truyền provinceCode thì filter theo tỉnh.
 */
export async function getWards(provinceCode?: string | number | null): Promise<V2Ward[]> {
  if (!isFresh(wardsCache)) {
    const res = await fetch(V2_WARDS_URL, {
      headers: FETCH_HEADERS,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      if (wardsCache) return filterWards(wardsCache.data, provinceCode);
      throw new Error(`Failed to fetch wards: ${res.status}`);
    }

    const data: V2Ward[] = await res.json();
    wardsCache = { data, ts: Date.now() };
  }

  return filterWards(wardsCache!.data, provinceCode);
}

function filterWards(wards: V2Ward[], provinceCode?: string | number | null): V2Ward[] {
  if (provinceCode == null || provinceCode === "") return wards;
  const code = String(provinceCode);
  return wards.filter((w) => String(w.province_code) === code);
}

// ---------------------------------------------------------------------------
// Dynamic alias map (tự build từ API data, KHÔNG hardcode)
// ---------------------------------------------------------------------------

/**
 * Tên viết tắt phổ biến. Chỉ giữ phần mapping thành phố lớn / tên thông dụng
 * mà KHÔNG THỂ suy ra tự động từ API (tên gọi tắt, tên cũ…).
 *
 * Key: dạng không dấu lowercase. Value: codename từ API v2.
 */
const MANUAL_EXTRA_ALIASES: Record<string, string> = {
  // TP.HCM
  hcm: "ho_chi_minh",
  "tp hcm": "ho_chi_minh",
  "sai gon": "ho_chi_minh",
  sg: "ho_chi_minh",
  // Hà Nội
  hn: "ha_noi",
  // Đà Nẵng
  dn: "da_nang",
  // Hải Phòng
  hp: "hai_phong",
  // Cần Thơ
  ct: "can_tho",
  // Tên thành phố / thắng cảnh phổ biến -> tỉnh chứa nó
  "nha trang": "khanh_hoa",
  "da lat": "lam_dong",
  "ha long": "quang_ninh",
  "hoi an": "quang_nam",
  "phan thiet": "binh_thuan",
  "phu quoc": "kien_giang",
  "vung tau": "ba_ria_vung_tau",
  // Huế – tên cũ "Thừa Thiên Huế", API v2 đã đổi thành "Thành phố Huế"
  "thua thien hue": "hue",
  // Tây Nguyên (vùng) -> default Đắk Lắk
  "tay nguyen": "dak_lak",
};

/**
 * Build alias map: normalizedName -> { name, code }.
 * Tự động tạo nhiều alias từ tên chính thức trong API:
 *   - Bỏ prefix "Tỉnh ", "Thành phố "
 *   - Bỏ dấu
 *   - codename gốc (vd: "ha_noi" -> "ha noi")
 * Sau đó merge thêm MANUAL_EXTRA_ALIASES.
 */
async function buildAliasMap(): Promise<Map<string, { name: string; code: number }>> {
  if (isFresh(aliasMapCache)) return aliasMapCache!.data;

  const provinces = await getProvinces();
  const map = new Map<string, { name: string; code: number }>();

  for (const p of provinces) {
    const entry = { name: p.name, code: p.code };

    // 1. Tên đầy đủ không dấu: "thanh pho ha noi"
    map.set(normalizeVietnamese(p.name), entry);

    // 2. Bỏ prefix "Tỉnh "/"Thành phố ": "ha noi"
    const short = p.name
      .replace(/^(Tỉnh|Thành phố)\s+/i, "")
      .trim();
    map.set(normalizeVietnamese(short), entry);

    // 3. codename (vd "ha_noi" -> "ha noi")
    map.set(p.codename.replace(/_/g, " "), entry);
  }

  // 4. Manual aliases
  for (const [alias, codename] of Object.entries(MANUAL_EXTRA_ALIASES)) {
    const prov = provinces.find((p) => p.codename === codename);
    if (prov) {
      map.set(alias, { name: prov.name, code: prov.code });
    }
  }

  aliasMapCache = { data: map, ts: Date.now() };
  return map;
}

// ---------------------------------------------------------------------------
// Public: Detect province in keyword
// ---------------------------------------------------------------------------

export type ProvinceDetection = {
  provinceName: string;
  provinceCode: number;
  remainingKeyword: string;
};

/**
 * Phát hiện tên tỉnh/thành phố trong keyword (có dấu hoặc không dấu).
 * Trả về tên chuẩn + mã code, phần keyword còn lại sau khi bỏ tên tỉnh.
 */
export async function detectProvinceInKeyword(
  keyword: string,
): Promise<ProvinceDetection | null> {
  const aliasMap = await buildAliasMap();
  const normalized = normalizeVietnamese(keyword);

  // Sắp xếp aliases theo độ dài giảm dần để match dài nhất trước
  const sortedAliases = [...aliasMap.entries()].sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [alias, { name, code }] of sortedAliases) {
    if (alias.length < 2) continue; // bỏ qua alias quá ngắn
    const regex = new RegExp(
      `(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
      "i",
    );
    if (regex.test(normalized)) {
      const remaining = normalized
        .replace(
          new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          " ",
        )
        .replace(/\s+/g, " ")
        .trim();
      return { provinceName: name, provinceCode: code, remainingKeyword: remaining };
    }
  }

  return null;
}

/**
 * Tìm province theo tên (có dấu hoặc không dấu).
 * Trả về { name, code } hoặc null.
 */
export async function findProvinceByName(
  input: string,
): Promise<{ name: string; code: number } | null> {
  const aliasMap = await buildAliasMap();
  const normalized = normalizeVietnamese(input.trim());
  return aliasMap.get(normalized) ?? null;
}

/**
 * Tìm province theo code.
 */
export async function findProvinceByCode(
  code: string | number,
): Promise<V2Province | null> {
  const provinces = await getProvinces();
  const numCode = typeof code === "string" ? parseInt(code, 10) : code;
  return provinces.find((p) => p.code === numCode) ?? null;
}

// ---------------------------------------------------------------------------
// Legacy compat – giữ cho các file import cũ không bị lỗi
// ---------------------------------------------------------------------------

export async function findOrCreateProvinceByCode(
  _: string | null | undefined,
): Promise<string | null> {
  return null;
}
