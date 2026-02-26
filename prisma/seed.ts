import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Normalize Vietnamese text for matching
function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

// Fetch provinces from API
async function fetchProvinces() {
  const response = await fetch("https://provinces.open-api.vn/api/v2/p/");
  if (!response.ok) throw new Error("Failed to fetch provinces");
  return response.json() as Promise<Array<{ name: string; code: number; codename: string }>>;
}

// Fetch wards from API
async function fetchWards() {
  const response = await fetch("https://provinces.open-api.vn/api/v2/w/");
  if (!response.ok) throw new Error("Failed to fetch wards");
  return response.json() as Promise<Array<{ name: string; code: number; province_code: number }>>;
}

// Find province code by name
function findProvinceCode(provinces: Array<{ name: string; code: number }>, provinceName: string): string | null {
  const normalized = normalizeVietnamese(provinceName);
  const province = provinces.find((p) => {
    const pName = normalizeVietnamese(p.name);
    return pName === normalized || pName.includes(normalized) || normalized.includes(pName);
  });
  return province ? province.code.toString() : null;
}

// Find ward code by name and province code
function findWardCode(
  wards: Array<{ name: string; code: number; province_code: number }>,
  wardName: string,
  provinceCode: string | null
): string | null {
  if (!provinceCode) return null;
  const normalized = normalizeVietnamese(wardName);
  const provinceCodeNum = parseInt(provinceCode);

  // Remove "Phường", "Xã", "Thị trấn" prefix for matching
  const normalizedClean = normalized.replace(/^(phường|xã|thị trấn)\s+/i, "").trim();

  // Extract numbers from normalized name (e.g., "14" from "Phường 14")
  const normalizedNumbers = normalized.match(/\d+/);

  const ward = wards.find((w) => {
    if (w.province_code !== provinceCodeNum) return false;
    const wName = normalizeVietnamese(w.name);
    const wNameClean = wName.replace(/^(phường|xã|thị trấn)\s+/i, "").trim();

    // Try multiple matching strategies
    // 1. Exact match
    if (wName === normalized) return true;
    if (wNameClean === normalizedClean) return true;

    // 2. Contains match
    if (wName.includes(normalized) || normalized.includes(wName)) return true;
    if (wNameClean.includes(normalizedClean) || normalizedClean.includes(wNameClean)) return true;

    // 3. Match by numbers (e.g., "Phường 14" matches "14" or "Phường 14")
    if (normalizedNumbers) {
      const wNumbers = wName.match(/\d+/);
      if (wNumbers && wNumbers[0] === normalizedNumbers[0]) {
        // Check if the non-number part matches or is empty
        const wNameNoNumbers = wNameClean.replace(/\d+/g, "").trim();
        const normalizedNoNumbers = normalizedClean.replace(/\d+/g, "").trim();
        if (!wNameNoNumbers || !normalizedNoNumbers || wNameNoNumbers === normalizedNoNumbers) {
          return true;
        }
      }
    }

    // 4. Match by name without numbers
    const wNameNoNumbers = wNameClean.replace(/\d+/g, "").trim();
    const normalizedNoNumbers = normalizedClean.replace(/\d+/g, "").trim();
    if (wNameNoNumbers && normalizedNoNumbers && wNameNoNumbers === normalizedNoNumbers) {
      return true;
    }

    return false;
  });
  return ward ? ward.code.toString() : null;
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@alonha.vn" },
    update: {},
    create: {
      email: "admin@alonha.vn",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@alonha.vn" },
    update: {},
    create: {
      email: "agent@alonha.vn",
      name: "Môi giới Nguyễn Văn A",
      phone: "0901234567",
      passwordHash,
      role: "AGENT",
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "user@alonha.vn" },
    update: {},
    create: {
      email: "user@alonha.vn",
      name: "Người dùng",
      passwordHash,
      role: "USER",
    },
  });

  console.log("Users:", admin.id, agent.id, guest.id);

  // Fetch administrative data from API
  console.log("Fetching provinces and wards from API...");
  const provinces = await fetchProvinces();
  const wards = await fetchWards();
  console.log(`Loaded ${provinces.length} provinces and ${wards.length} wards`);

  // Nhóm phường/xã theo mã tỉnh để fallback khi không map được tên
  const wardsByProvince = new Map<number, Array<{ name: string; code: number }>>();
  for (const w of wards) {
    const list = wardsByProvince.get(w.province_code) ?? [];
    list.push({ name: w.name, code: w.code });
    wardsByProvince.set(w.province_code, list);
  }

  const placeImg = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

  // 20 tin demo – provinceName/wardName dùng đúng tên từ API (provinces.open-api.vn)
  const listings = [
    // 1. Hà Nội – căn hộ hạng A trung tâm (đúng tên API: Phường Ngọc Hà)
    {
      provinceName: "Thành phố Hà Nội",
      provinceKeyword: "Hà Nội",
      title: "Căn hộ 3PN Vinhomes Metropolis, view hồ Thủ Lệ",
      listingType: "SALE" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 11_200_000_000,
      pricePerSqm: 98_000_000,
      area: 114,
      bedrooms: 3,
      bathrooms: 2,
      direction: "Tây Bắc",
      legalStatus: "Sổ đỏ lâu dài, sang tên ngay",
      furniture: "Full nội thất cao cấp, thiết kế hiện đại Bắc Âu",
      address: "29 Liễu Giai, phường Ngọc Hà, quận Ba Đình, TP. Hà Nội",
      wardName: "Phường Ngọc Hà",
      latitude: 21.033492,
      longitude: 105.812438,
      description:
        "Căn hộ 3 phòng ngủ tại Vinhomes Metropolis, tầng cao, view hồ Thủ Lệ và skyline phía Tây Hà Nội. Layout vuông vức, bếp tách biệt, logia phơi riêng. Chủ nhà để lại nội thất nhập khẩu, điều hòa âm trần, thiết bị vệ sinh cao cấp. Nội khu có bể bơi bốn mùa, TTTM, trường học quốc tế.",
      isVip: true,
      isVerified: true,
      hasVideo: true,
      images: [
        "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 2. Hà Nội – nhà riêng Thanh Xuân (đúng tên API: Phường Thanh Xuân)
    {
      provinceName: "Thành phố Hà Nội",
      provinceKeyword: "Hà Nội",
      title: "Nhà riêng 4 tầng ngõ rộng Nguyễn Trãi, Thanh Xuân",
      listingType: "SALE" as const,
      category: "NHA_RIENG" as const,
      price: 6_300_000_000,
      pricePerSqm: 121_000_000,
      area: 52,
      bedrooms: 4,
      bathrooms: 3,
      direction: "Đông Nam",
      legalStatus: "Sổ đỏ chính chủ, nở hậu nhẹ",
      furniture: "Để lại phần lớn nội thất: tủ bếp, tủ âm tường, điều hòa",
      address: "Ngõ 477 Nguyễn Trãi, phường Thanh Xuân, quận Thanh Xuân, TP. Hà Nội",
      wardName: "Phường Thanh Xuân",
      latitude: 20.992851,
      longitude: 105.803642,
      description:
        "Nhà 4 tầng, mặt tiền 4.1m, ngõ trước nhà 3.5m, cách mặt phố Nguyễn Trãi khoảng 80m. Thiết kế mỗi tầng 2 phòng, cầu thang giữa, giếng trời. Khu dân trí cao, gần Royal City và các trường đại học lớn.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 3. TP.HCM – căn hộ cao cấp Thủ Thiêm (tên API: Phường Thủ Thiêm nếu có, fallback ward)
    {
      provinceName: "Thành phố Hồ Chí Minh",
      provinceKeyword: "Hồ Chí Minh",
      title: "Căn hộ 2PN The Metropole Thủ Thiêm, view sông Sài Gòn",
      listingType: "SALE" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 9_800_000_000,
      pricePerSqm: 110_000_000,
      area: 89,
      bedrooms: 2,
      bathrooms: 2,
      direction: "Đông Bắc",
      legalStatus: "Sổ hồng lâu dài",
      furniture: "Full nội thất sang trọng, thiết kế theo phong cách resort",
      address: "Đại lộ Vòng Cung, phường Thủ Thiêm, TP. Thủ Đức, TP. Hồ Chí Minh",
      wardName: "Phường Thủ Thiêm",
      latitude: 10.77194,
      longitude: 106.718899,
      description:
        "Căn hộ 2PN, ban công rộng view sông Sài Gòn và quận 1. Trần cao 3m, kính Low-E toàn căn, bếp đảo rộng, logia phơi riêng. Tiện ích 5*: hồ bơi tràn bờ, phòng gym, lounge, khu BBQ. Vị trí trung tâm TP. Thủ Đức, kết nối nhanh về quận 1.",
      isVip: true,
      isVerified: true,
      has360Tour: true,
      images: [
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-0ef3c08c0632?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 4. TP.HCM – căn hộ cho thuê Gò Vấp
    {
      provinceName: "Thành phố Hồ Chí Minh",
      provinceKeyword: "Hồ Chí Minh",
      title: "Căn hộ 1PN Gò Vấp, nội thất mới, gần sân bay",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 8_500_000,
      area: 40,
      bedrooms: 1,
      bathrooms: 1,
      direction: "Tây Bắc",
      legalStatus: "Hợp đồng 12 tháng, cọc 1 tháng",
      furniture: "Full nội thất: máy lạnh, tủ lạnh, máy giặt, giường tủ",
      address: "Đường Phạm Văn Chiêu, phường 14, quận Gò Vấp, TP. Hồ Chí Minh",
      wardName: "Phường 14",
      latitude: 10.853148,
      longitude: 106.651836,
      description:
        "Căn hộ 1PN trong tòa nhà mới, hành lang rộng, thang máy thẻ từ. Ban công thoáng, view khu dân cư, di chuyển nhanh ra sân bay Tân Sơn Nhất và trung tâm Gò Vấp.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1521782462922-9318be1a5a22?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 5. Đà Nẵng – căn hộ gần cầu Rồng
    {
      provinceName: "Thành phố Đà Nẵng",
      provinceKeyword: "Đà Nẵng",
      title: "Cho thuê căn hộ 1PN Nguyễn Văn Linh, view sông Hàn",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 12_000_000,
      area: 48,
      bedrooms: 1,
      bathrooms: 1,
      direction: "Đông Nam",
      legalStatus: "Hợp đồng tối thiểu 6 tháng",
      furniture: "Full nội thất, dọn vào ở ngay",
      address: "Đường Nguyễn Văn Linh, phường Bình Hiên, quận Hải Châu, TP. Đà Nẵng",
      wardName: "Phường Bình Hiên",
      latitude: 16.060426,
      longitude: 108.224548,
      description:
        "Căn hộ 1PN thiết kế mở, ban công nhìn sông Hàn, cách cầu Rồng vài phút di chuyển. Căn góc 2 mặt thoáng, bếp đầy đủ thiết bị. Tòa nhà có hầm gửi xe, thang máy, bảo vệ 24/7.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 6. Đà Nẵng – nhà phố An Thượng gần biển Mỹ Khê
    {
      provinceName: "Thành phố Đà Nẵng",
      provinceKeyword: "Đà Nẵng",
      title: "Nhà phố 3 tầng khu An Thượng, đi bộ ra biển Mỹ Khê",
      listingType: "RENT" as const,
      category: "NHA_MAT_PHONG" as const,
      price: 45_000_000,
      area: 120,
      bedrooms: 5,
      bathrooms: 5,
      direction: "Đông",
      legalStatus: "Hợp đồng thuê tối thiểu 2 năm",
      furniture: "Setup sẵn cho homestay hoặc văn phòng kết hợp ở",
      address: "Đường An Thượng 26, phường Mỹ An, quận Ngũ Hành Sơn, TP. Đà Nẵng",
      wardName: "Phường Mỹ An",
      latitude: 16.050398,
      longitude: 108.244087,
      description:
        "Nhà 3 tầng, 5 phòng ngủ khép kín, khu An Thượng sầm uất, khách du lịch đông quanh năm. Cách biển Mỹ Khê khoảng 300m, phù hợp homestay, hostel hoặc văn phòng kết hợp ở.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1600585154154-1cde0be25c16?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 7. Nha Trang – căn hộ nghỉ dưỡng biển Trần Phú
    {
      provinceName: "Tỉnh Khánh Hòa",
      provinceKeyword: "Khánh Hòa",
      title: "Căn hộ 2PN mặt biển Trần Phú, Nha Trang",
      listingType: "SALE" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 6_900_000_000,
      pricePerSqm: 80_000_000,
      area: 86,
      bedrooms: 2,
      bathrooms: 2,
      direction: "Đông",
      legalStatus: "Sổ hồng lâu dài",
      furniture: "Nội thất chuẩn condotel 5*, khai thác cho thuê ngay",
      address: "Đường Trần Phú, phường Lộc Thọ, TP. Nha Trang, Khánh Hòa",
      wardName: "Phường Lộc Thọ",
      latitude: 12.238791,
      longitude: 109.196749,
      description:
        "Căn hộ 2PN tầng cao, view biển panorama, phòng khách và phòng ngủ đều nhìn ra biển. Tòa nhà có hồ bơi vô cực, sky bar, lễ tân 24/7, phù hợp nghỉ dưỡng và cho thuê ngắn hạn.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 8. Đà Lạt – villa sân vườn
    {
      provinceName: "Tỉnh Lâm Đồng",
      provinceKeyword: "Lâm Đồng",
      title: "Villa sân vườn 4PN Đà Lạt, view đồi thông",
      listingType: "RENT" as const,
      category: "NHA_RIENG" as const,
      price: 35_000_000,
      area: 260,
      bedrooms: 4,
      bathrooms: 4,
      direction: "Tây Nam",
      legalStatus: "Hợp đồng thuê tối thiểu 1 năm",
      furniture: "Full nội thất homestay cao cấp, bếp rộng, lò sưởi",
      address: "Đường Phù Đổng Thiên Vương, phường 8, TP. Đà Lạt, Lâm Đồng",
      wardName: "Phường 8",
      latitude: 11.958,
      longitude: 108.441,
      description:
        "Villa 3 tầng, sân vườn rộng, nhiều cây xanh, khu BBQ ngoài trời và chòi trà nhìn thung lũng. Cách chợ Đà Lạt khoảng 10 phút chạy xe, phù hợp gia đình hoặc nhóm bạn 10–14 người.",
      isVerified: true,
      has360Tour: true,
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 13. Hạ Long – biệt thự nghỉ dưỡng
    {
      provinceName: "Tỉnh Quảng Ninh",
      provinceKeyword: "Quảng Ninh",
      title: "Biệt thự song lập 5PN Hạ Long, view vịnh",
      listingType: "SALE" as const,
      category: "NHA_RIENG" as const,
      price: 18_900_000_000,
      area: 300,
      bedrooms: 5,
      bathrooms: 5,
      direction: "Đông Bắc",
      legalStatus: "Sổ đỏ lâu dài, đã hoàn công",
      furniture: "Full nội thất phong cách resort 5 sao",
      address: "KĐT Hạ Long Marina, phường Hùng Thắng, TP. Hạ Long, Quảng Ninh",
      wardName: "Phường Hùng Thắng",
      latitude: 20.947584,
      longitude: 107.030487,
      description:
        "Biệt thự song lập 3 tầng, sân vườn trước sau và hồ bơi riêng, view trực diện vịnh Hạ Long. Thích hợp villa nghỉ dưỡng cao cấp hoặc homestay doanh thu cao.",
      isVip: true,
      isVerified: true,
      hasVideo: true,
      images: [
        "https://images.unsplash.com/photo-1512914890250-353c97c9e7e2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 14. Phú Quốc – đất nền bãi Trường
    {
      provinceName: "Tỉnh Kiên Giang",
      provinceKeyword: "Kiên Giang",
      title: "Đất nền 2 mặt tiền gần bãi Trường, Phú Quốc",
      listingType: "SALE" as const,
      category: "DAT_NEN" as const,
      price: 5_800_000_000,
      area: 200,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Tây",
      legalStatus: "Sổ đỏ, quy hoạch đất ở đô thị",
      furniture: null,
      address: "Gần đường Trần Hưng Đạo kéo dài, xã Dương Tơ, TP. Phú Quốc, Kiên Giang",
      wardName: "Xã Dương Tơ",
      latitude: 10.166153,
      longitude: 103.993079,
      description:
        "Lô đất 2 mặt tiền hiếm, nằm trên trục đường dẫn ra bãi Trường – khu du lịch sầm uất nhất Phú Quốc. Phù hợp xây boutique hotel, villa nghỉ dưỡng hoặc shophouse dịch vụ.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 15. Quy Nhơn – căn hộ studio view biển
    {
      provinceName: "Tỉnh Bình Định",
      provinceKeyword: "Bình Định",
      title: "Cho thuê căn hộ studio view biển Quy Nhơn",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 9_000_000,
      area: 38,
      bedrooms: 1,
      bathrooms: 1,
      direction: "Đông Nam",
      legalStatus: "Hợp đồng 12 tháng, cọc 1 tháng",
      furniture: "Full nội thất: bếp, máy giặt, sofa bed, tủ quần áo",
      address: "Đường An Dương Vương, phường Nguyễn Văn Cừ, TP. Quy Nhơn, Bình Định",
      wardName: "Phường Nguyễn Văn Cừ",
      latitude: 13.769771,
      longitude: 109.228527,
      description:
        "Căn hộ studio tầng cao, ban công nhìn thẳng ra biển, cách bãi tắm chỉ vài bước chân. Nội thất mới, thiết kế tối giản, có bếp riêng, tòa nhà có hầm xe và bảo vệ 24/7.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 16. Sa Pa – homestay gỗ Lao Chải
    {
      provinceName: "Tỉnh Lào Cai",
      provinceKeyword: "Lào Cai",
      title: "Homestay gỗ 6 phòng view thung lũng Mường Hoa",
      listingType: "SALE" as const,
      category: "BDS_KHAC" as const,
      price: 9_200_000_000,
      area: 450,
      bedrooms: 6,
      bathrooms: 7,
      direction: "Đông",
      legalStatus: "Giấy chứng nhận QSDĐ, đất ở kết hợp thương mại",
      furniture: "Bàn giao full nội thất homestay đang khai thác",
      address: "Bản Lao Chải, xã San Sả Hồ, thị xã Sa Pa, Lào Cai",
      wardName: "Xã San Sả Hồ",
      latitude: 22.311958,
      longitude: 103.864319,
      description:
        "Homestay 6 phòng, mỗi phòng có ban công nhìn thung lũng Mường Hoa. Sân vườn rộng, khu lửa trại và bếp chung, lượng khách ổn định quanh năm từ các OTA.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 17. Đồng Nai – đất nền Long Thành
    {
      provinceName: "Tỉnh Đồng Nai",
      provinceKeyword: "Đồng Nai",
      title: "Đất nền 5x20m gần KCN Long Thành, sổ riêng thổ cư",
      listingType: "SALE" as const,
      category: "DAT_NEN" as const,
      price: 1_650_000_000,
      area: 100,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Tây Bắc",
      legalStatus: "Sổ đỏ riêng, quy hoạch đất ở đô thị",
      furniture: null,
      address: "Xã An Phước, huyện Long Thành, Đồng Nai",
      wardName: "Xã An Phước",
      latitude: 10.803989,
      longitude: 106.999489,
      description:
        "Lô đất vuông vức 5x20m, đường bê tông 7m, cách KCN Long Thành khoảng 2km, gần chợ và trường học. Rất phù hợp xây nhà trọ hoặc nhà ở cho chuyên gia.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 18. Bắc Ninh – nhà phố gần KCN Yên Phong
    {
      provinceName: "Tỉnh Bắc Ninh",
      provinceKeyword: "Bắc Ninh",
      title: "Nhà mặt phố 2 làn gần KCN Yên Phong",
      listingType: "SALE" as const,
      category: "NHA_MAT_PHONG" as const,
      price: 9_800_000_000,
      area: 135,
      bedrooms: 6,
      bathrooms: 5,
      direction: "Tây Nam",
      legalStatus: "Sổ đỏ vuông vắn, đã hoàn công",
      furniture: "Full nội thất cho thuê, đang khai thác dòng tiền",
      address: "Đường 286, thị trấn Chờ, huyện Yên Phong, Bắc Ninh",
      wardName: "Thị trấn Chờ",
      latitude: 21.134544,
      longitude: 105.994469,
      description:
        "Nhà 4 tầng, mặt tiền 6m, đường 2 làn rộng, đang cho chuyên gia Samsung thuê. Khu vực kinh doanh sầm uất, phù hợp nhà đầu tư tìm tài sản dòng tiền ổn định.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0b?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 19. An Giang – nhà phố Núi Sam
    {
      provinceName: "Tỉnh An Giang",
      provinceKeyword: "An Giang",
      title: "Nhà phố 1 trệt 1 lầu gần Miếu Bà, Châu Đốc",
      listingType: "SALE" as const,
      category: "NHA_RIENG" as const,
      price: 3_100_000_000,
      area: 90,
      bedrooms: 3,
      bathrooms: 2,
      direction: "Đông",
      legalStatus: "Sổ hồng riêng, hoàn công đầy đủ",
      furniture: "Nội thất cơ bản, bếp và tủ quần áo",
      address: "Phường Núi Sam, TP. Châu Đốc, An Giang",
      wardName: "Phường Núi Sam",
      latitude: 10.692353,
      longitude: 105.079674,
      description:
        "Nhà 1 trệt 1 lầu, sân trước rộng đậu ô tô 7 chỗ, cách Miếu Bà Chúa Xứ khoảng 1km. Khu vực đông khách hành hương, phù hợp vừa ở vừa kinh doanh homestay hoặc quán ăn gia đình.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 20. Vĩnh Long – đất vườn ven sông Cổ Chiên
    {
      provinceName: "Tỉnh Vĩnh Long",
      provinceKeyword: "Vĩnh Long",
      title: "Đất vườn 1500m² ven sông Cổ Chiên",
      listingType: "SALE" as const,
      category: "BDS_KHAC" as const,
      price: 4_400_000_000,
      area: 1500,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Nam",
      legalStatus: "Sổ đỏ riêng, đất cây lâu năm có thể chuyển thổ",
      furniture: null,
      address: "Xã An Bình, huyện Long Hồ, Vĩnh Long",
      wardName: "Xã An Bình",
      latitude: 10.242888,
      longitude: 105.989014,
      description:
        "Đất vườn 1500m², mặt tiền sông Cổ Chiên hơn 30m, đã trồng nhiều cây ăn trái như sầu riêng, măng cụt. Đường bê tông 4m, xe tải nhỏ vào tận nơi, rất phù hợp làm nhà vườn nghỉ dưỡng hoặc homestay miệt vườn.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 21. Hà Nội – căn hộ cho thuê Cầu Giấy
    {
      provinceName: "Thành phố Hà Nội",
      provinceKeyword: "Hà Nội",
      title: "Cho thuê căn hộ 2PN Cầu Giấy, gần Big C",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 12_000_000,
      area: 65,
      bedrooms: 2,
      bathrooms: 1,
      direction: "Nam",
      legalStatus: "Hợp đồng 12 tháng, cọc 1 tháng",
      furniture: "Full nội thất: máy lạnh, tủ lạnh, máy giặt",
      address: "Đường Hoàng Quốc Việt, phường Cầu Giấy, quận Cầu Giấy, TP. Hà Nội",
      wardName: "Phường Cầu Giấy",
      latitude: 21.0305,
      longitude: 105.8014,
      description:
        "Căn hộ 2PN tầng trung, ban công thoáng, gần Big C Thăng Long và các trường đại học. Nội thất đầy đủ, sạch sẽ, phù hợp sinh viên hoặc nhân viên văn phòng.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1521782462922-9318be1a5a22?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 22. Hà Nội – nhà mặt phố Hoàn Kiếm
    {
      provinceName: "Thành phố Hà Nội",
      provinceKeyword: "Hà Nội",
      title: "Nhà mặt phố 4 tầng phố cổ Hoàn Kiếm",
      listingType: "SALE" as const,
      category: "NHA_MAT_PHONG" as const,
      price: 15_000_000_000,
      pricePerSqm: 200_000_000,
      area: 75,
      bedrooms: 5,
      bathrooms: 3,
      direction: "Đông",
      legalStatus: "Sổ đỏ chính chủ, pháp lý rõ ràng",
      furniture: "Full nội thất cổ điển, phù hợp kinh doanh",
      address: "Phố Hàng Bông, phường Hoàn Kiếm, quận Hoàn Kiếm, TP. Hà Nội",
      wardName: "Phường Hoàn Kiếm",
      latitude: 21.0285,
      longitude: 105.8542,
      description:
        "Nhà mặt phố 4 tầng trong khu phố cổ, mặt tiền 4m, vị trí đắc địa gần hồ Hoàn Kiếm. Phù hợp kinh doanh khách sạn mini, nhà hàng hoặc văn phòng.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 23. TP.HCM – căn hộ cho thuê Quận 1
    {
      provinceName: "Thành phố Hồ Chí Minh",
      provinceKeyword: "Hồ Chí Minh",
      title: "Cho thuê căn hộ 1PN Quận 1, gần Bến Thành",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 10_000_000,
      area: 45,
      bedrooms: 1,
      bathrooms: 1,
      direction: "Tây Nam",
      legalStatus: "Hợp đồng 6 tháng, cọc 1 tháng",
      furniture: "Full nội thất, máy lạnh, tủ lạnh",
      address: "Đường Nguyễn Du, phường Bến Nghé, quận 1, TP. Hồ Chí Minh",
      wardName: "Phường Bến Nghé",
      latitude: 10.7769,
      longitude: 106.7009,
      description:
        "Căn hộ 1PN tầng cao, view thành phố, cách chợ Bến Thành 5 phút đi bộ. Nội thất mới, an ninh tốt, phù hợp người đi làm.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-0ef3c08c0632?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 24. TP.HCM – nhà phố Quận 7
    {
      provinceName: "Thành phố Hồ Chí Minh",
      provinceKeyword: "Hồ Chí Minh",
      title: "Nhà phố 3 tầng Quận 7, gần Crescent Mall",
      listingType: "SALE" as const,
      category: "NHA_MAT_PHONG" as const,
      price: 12_500_000_000,
      pricePerSqm: 150_000_000,
      area: 83,
      bedrooms: 4,
      bathrooms: 3,
      direction: "Đông Nam",
      legalStatus: "Sổ hồng lâu dài",
      furniture: "Full nội thất hiện đại",
      address: "Đường Nguyễn Thị Thập, phường Tân Phú, quận 7, TP. Hồ Chí Minh",
      wardName: "Phường Tân Phú",
      latitude: 10.7297,
      longitude: 106.7179,
      description:
        "Nhà phố 3 tầng, mặt tiền 5m, trong khu dân cư cao cấp gần Crescent Mall. Thiết kế hiện đại, phù hợp ở hoặc kinh doanh.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1600585154154-1cde0be25c16?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 25. Đà Nẵng – căn hộ cho thuê gần biển
    {
      provinceName: "Thành phố Đà Nẵng",
      provinceKeyword: "Đà Nẵng",
      title: "Cho thuê căn hộ 2PN view biển Mỹ Khê",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 15_000_000,
      area: 70,
      bedrooms: 2,
      bathrooms: 2,
      direction: "Đông",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: "Full nội thất resort",
      address: "Đường Võ Nguyên Giáp, phường Mỹ An, quận Ngũ Hành Sơn, TP. Đà Nẵng",
      wardName: "Phường Mỹ An",
      latitude: 16.0504,
      longitude: 108.2441,
      description:
        "Căn hộ 2PN tầng cao, ban công view biển Mỹ Khê, cách bãi biển 200m. Nội thất sang trọng, phù hợp nghỉ dưỡng hoặc ở lâu dài.",
      isVip: true,
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 26. Đà Nẵng – đất nền ven sông Hàn
    {
      provinceName: "Thành phố Đà Nẵng",
      provinceKeyword: "Đà Nẵng",
      title: "Đất nền 100m² ven sông Hàn, view cầu Rồng",
      listingType: "SALE" as const,
      category: "DAT_NEN" as const,
      price: 8_500_000_000,
      area: 100,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Đông",
      legalStatus: "Sổ đỏ riêng, quy hoạch đất ở",
      furniture: null,
      address: "Đường Bạch Đằng, phường Bình Hiên, quận Hải Châu, TP. Đà Nẵng",
      wardName: "Phường Bình Hiên",
      latitude: 16.0604,
      longitude: 108.2245,
      description:
        "Lô đất vuông vức 100m², mặt tiền đường Bạch Đằng, view sông Hàn và cầu Rồng. Vị trí đắc địa, phù hợp xây nhà phố hoặc khách sạn mini.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 27. Nha Trang – căn hộ cho thuê ngắn hạn
    {
      provinceName: "Tỉnh Khánh Hòa",
      provinceKeyword: "Khánh Hòa",
      title: "Cho thuê căn hộ 1PN Nha Trang, gần bãi biển",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 6_000_000,
      area: 50,
      bedrooms: 1,
      bathrooms: 1,
      direction: "Đông",
      legalStatus: "Hợp đồng linh hoạt",
      furniture: "Full nội thất, máy lạnh",
      address: "Đường Trần Phú, phường Lộc Thọ, TP. Nha Trang, Khánh Hòa",
      wardName: "Phường Lộc Thọ",
      latitude: 12.2388,
      longitude: 109.1967,
      description:
        "Căn hộ 1PN tầng trung, cách bãi biển Nha Trang 300m. Nội thất đầy đủ, phù hợp khách du lịch hoặc người đi làm.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 28. Đà Lạt – homestay cho thuê
    {
      provinceName: "Tỉnh Lâm Đồng",
      provinceKeyword: "Lâm Đồng",
      title: "Cho thuê homestay 5 phòng Đà Lạt, view đồi thông",
      listingType: "RENT" as const,
      category: "BDS_KHAC" as const,
      price: 25_000_000,
      area: 200,
      bedrooms: 5,
      bathrooms: 4,
      direction: "Tây Nam",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: "Full nội thất homestay",
      address: "Đường Phù Đổng Thiên Vương, phường 8, TP. Đà Lạt, Lâm Đồng",
      wardName: "Phường 8",
      latitude: 11.958,
      longitude: 108.441,
      description:
        "Homestay 5 phòng, sân vườn rộng, view đồi thông. Phù hợp kinh doanh homestay hoặc nhóm bạn, gia đình.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 29. Hạ Long – căn hộ cho thuê
    {
      provinceName: "Tỉnh Quảng Ninh",
      provinceKeyword: "Quảng Ninh",
      title: "Cho thuê căn hộ 2PN Hạ Long, view vịnh",
      listingType: "RENT" as const,
      category: "CAN_HO_CHUNG_CU" as const,
      price: 8_000_000,
      area: 75,
      bedrooms: 2,
      bathrooms: 1,
      direction: "Đông Bắc",
      legalStatus: "Hợp đồng 6 tháng",
      furniture: "Full nội thất",
      address: "KĐT Hạ Long Marina, phường Hùng Thắng, TP. Hạ Long, Quảng Ninh",
      wardName: "Phường Hùng Thắng",
      latitude: 20.9476,
      longitude: 107.0305,
      description:
        "Căn hộ 2PN tầng cao, ban công view vịnh Hạ Long. Nội thất đầy đủ, phù hợp nghỉ dưỡng hoặc ở lâu dài.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1512914890250-353c97c9e7e2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 30. Bắc Ninh – nhà phố cho thuê
    {
      provinceName: "Tỉnh Bắc Ninh",
      provinceKeyword: "Bắc Ninh",
      title: "Cho thuê nhà phố 3 tầng gần KCN",
      listingType: "RENT" as const,
      category: "NHA_MAT_PHONG" as const,
      price: 20_000_000,
      area: 120,
      bedrooms: 4,
      bathrooms: 3,
      direction: "Tây Nam",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: "Nội thất cơ bản",
      address: "Đường 286, thị trấn Chờ, huyện Yên Phong, Bắc Ninh",
      wardName: "Thị trấn Chờ",
      latitude: 21.1345,
      longitude: 105.9945,
      description:
        "Nhà phố 3 tầng, mặt tiền 6m, gần KCN Yên Phong. Phù hợp gia đình hoặc cho chuyên gia thuê.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0b?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 31. Đồng Nai – đất nền cho thuê
    {
      provinceName: "Tỉnh Đồng Nai",
      provinceKeyword: "Đồng Nai",
      title: "Cho thuê đất nền 200m² gần KCN",
      listingType: "RENT" as const,
      category: "DAT_NEN" as const,
      price: 5_000_000,
      area: 200,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Tây Bắc",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: null,
      address: "Xã An Phước, huyện Long Thành, Đồng Nai",
      wardName: "Xã An Phước",
      latitude: 10.804,
      longitude: 106.9995,
      description:
        "Đất nền 200m², đường bê tông 7m, gần KCN Long Thành. Phù hợp làm bãi đỗ xe, kho bãi hoặc xây nhà trọ.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 32. An Giang – nhà phố cho thuê
    {
      provinceName: "Tỉnh An Giang",
      provinceKeyword: "An Giang",
      title: "Cho thuê nhà phố 2 tầng Châu Đốc",
      listingType: "RENT" as const,
      category: "NHA_RIENG" as const,
      price: 8_000_000,
      area: 80,
      bedrooms: 3,
      bathrooms: 2,
      direction: "Đông",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: "Nội thất cơ bản",
      address: "Phường Núi Sam, TP. Châu Đốc, An Giang",
      wardName: "Phường Núi Sam",
      latitude: 10.6924,
      longitude: 105.0797,
      description:
        "Nhà phố 2 tầng, sân trước rộng, gần Miếu Bà Chúa Xứ. Phù hợp ở hoặc kinh doanh homestay.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 33. Vĩnh Long – đất vườn cho thuê
    {
      provinceName: "Tỉnh Vĩnh Long",
      provinceKeyword: "Vĩnh Long",
      title: "Cho thuê đất vườn 2000m² ven sông",
      listingType: "RENT" as const,
      category: "BDS_KHAC" as const,
      price: 10_000_000,
      area: 2000,
      bedrooms: 0,
      bathrooms: 0,
      direction: "Nam",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: null,
      address: "Xã An Bình, huyện Long Hồ, Vĩnh Long",
      wardName: "Xã An Bình",
      latitude: 10.2429,
      longitude: 105.989,
      description:
        "Đất vườn 2000m², mặt tiền sông, đã có cây ăn trái. Phù hợp làm nhà vườn nghỉ dưỡng hoặc trồng trọt.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517061493161-3d9b2e4a52c5?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 34. Hà Nội – kho xưởng
    {
      provinceName: "Thành phố Hà Nội",
      provinceKeyword: "Hà Nội",
      title: "Cho thuê kho xưởng 500m² Long Biên",
      listingType: "RENT" as const,
      category: "KHO_NHA_XUONG" as const,
      price: 25_000_000,
      area: 500,
      bedrooms: 0,
      bathrooms: 1,
      direction: "Tây",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: null,
      address: "Đường Nguyễn Văn Linh, phường Long Biên, quận Long Biên, TP. Hà Nội",
      wardName: "Phường Long Biên",
      latitude: 21.0388,
      longitude: 105.8889,
      description:
        "Kho xưởng 500m², trần cao, cửa xe tải vào được. Vị trí gần cầu Chương Dương, thuận tiện vận chuyển.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    // 35. TP.HCM – kho xưởng
    {
      provinceName: "Thành phố Hồ Chí Minh",
      provinceKeyword: "Hồ Chí Minh",
      title: "Cho thuê kho xưởng 800m² Bình Tân",
      listingType: "RENT" as const,
      category: "KHO_NHA_XUONG" as const,
      price: 35_000_000,
      area: 800,
      bedrooms: 0,
      bathrooms: 1,
      direction: "Tây",
      legalStatus: "Hợp đồng 12 tháng",
      furniture: null,
      address: "Đường Tỉnh Lộ 10, phường Tân Tạo, quận Bình Tân, TP. Hồ Chí Minh",
      wardName: "Phường Tân Tạo",
      latitude: 10.7281,
      longitude: 106.5958,
      description:
        "Kho xưởng 800m², trần cao, có sân bãi rộng. Gần cao tốc, thuận tiện vận chuyển hàng hóa.",
      isVerified: true,
      images: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  for (const l of listings) {
    const existing = await prisma.listing.findFirst({ where: { title: l.title, ownerId: agent.id } });
    if (existing) continue;
    const s = slug(l.title) + "-" + Math.random().toString(36).slice(2, 8);

    // Map province and ward codes from API
    let provinceCode = findProvinceCode(provinces, l.provinceName);
    let wardCode = findWardCode(wards, l.wardName, provinceCode);
    let provinceName = l.provinceName;
    let wardName = l.wardName;

    // Fallback: nếu không map được ward, lấy phường/xã đầu tiên của tỉnh từ API
    if (provinceCode && !wardCode) {
      const list = wardsByProvince.get(parseInt(provinceCode));
      if (list && list.length > 0) {
        wardCode = list[0].code.toString();
        wardName = list[0].name;
        console.warn(`⚠️  Using first ward of province for: ${l.title} → ${wardName}`);
      }
    }
    if (!provinceCode) {
      console.warn(`⚠️  Could not find province code for: ${l.provinceName}`);
    }
    if (!wardCode) {
      console.warn(`⚠️  Could not find ward code for: ${l.wardName} in ${l.provinceName}`);
    }

    const created = await prisma.listing.create({
      data: {
        slug: s,
        title: l.title,
        description: l.description ?? null,
        listingType: l.listingType,
        category: l.category,
        status: "APPROVED",
        price: l.price,
        pricePerSqm: l.pricePerSqm ?? null,
        area: l.area,
        bedrooms: l.bedrooms ?? null,
        bathrooms: l.bathrooms ?? null,
        direction: l.direction ?? null,
        legalStatus: l.legalStatus ?? null,
        furniture: l.furniture ?? null,
        address: l.address ?? null,
        provinceCode: provinceCode ?? null,
        provinceName,
        wardCode: wardCode ?? null,
        wardName,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
        contactName: "Liên hệ",
        contactPhone: "0900000000",
        ownerId: agent.id,
        publishedAt: new Date(),
        isVip: l.isVip ?? false,
        isVerified: l.isVerified ?? false,
        hasVideo: l.hasVideo ?? false,
        has360Tour: l.has360Tour ?? false,
      } as import("@prisma/client").Prisma.ListingUncheckedCreateInput,
    });

    const imageUrls = (l as any).images && Array.isArray((l as any).images) && (l as any).images.length > 0 ? (l as any).images : [placeImg];
    await prisma.listingImage.createMany({
      data: imageUrls.slice(0, 8).map((url: string, index: number) => ({
        listingId: created.id,
        url,
        order: index,
        isPrimary: index === 0,
      })),
    });
  }

  await prisma.servicePackage.upsert({
    where: { code: "vip_diamond" },
    update: {},
    create: { code: "vip_diamond", name: "VIP Kim cương", price: 500_000, durationDays: 30, sortOrder: 1 },
  });
  // ================= PROJECT SEEDING =================
  console.log("Seeding Projects...");
  const projects = [
    {
      name: "Vinhomes Central Park",
      description: "Khu đô thị hiện đại và cao cấp bậc nhất Việt Nam với tòa tháp Landmark 81 cao nhất Việt Nam. Sở hữu công viên ven sông 14ha, bến du thuyền đẳng cấp.",
      address: "208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
      developer: "Vingroup",
      totalArea: 43.91, // ha
      imageUrl: "https://images.unsplash.com/photo-1565626424178-c699f660ba26?w=1200&q=80",
    },
    {
      name: "Vinhomes Grand Park",
      description: "Đại đô thị thông minh đẳng cấp quốc tế tại TP. Thủ Đức. Nổi bật với công viên ánh sáng 36ha hàng đầu Đông Nam Á.",
      address: "Nguyễn Xiển, Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh",
      developer: "Vingroup",
      totalArea: 271, // ha
      imageUrl: "https://images.unsplash.com/photo-1594488518063-54917409546d?w=1200&q=80",
    },
    {
      name: "Empire City",
      description: "Khu phức hợp tháp quan sát cao cấp tại Thủ Thiêm. Biểu tượng mới của TP.HCM với kiến trúc độc đáo mô phỏng ruộng bậc thang.",
      address: "Khu chức năng số 2B, KĐT Thủ Thiêm, TP. Thủ Đức, TP. Hồ Chí Minh",
      developer: "Keppel Land",
      totalArea: 14.5, // ha
      imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=1200&q=80",
    },
    {
      name: "Masteri Thảo Điền",
      description: "Khu căn hộ cao cấp kết hợp trung tâm thương mại, kết nối trực tiếp với ga Metro An Phú. Cộng đồng cư dân quốc tế văn minh.",
      address: "159 Xa lộ Hà Nội, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh",
      developer: "Masterise Homes",
      totalArea: 7.9, // ha
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
    },
    {
      name: "Vinhomes Ocean Park",
      description: "Thành phố biển hồ giữa lòng Hà Nội. Nổi bật với biển hồ nước mặn 6.1ha và hồ Ngọc Trai 24.5ha.",
      address: "Đa Tốn, Gia Lâm, Hà Nội",
      developer: "Vingroup",
      totalArea: 420, // ha
      imageUrl: "https://images.unsplash.com/photo-1570129477492-45f003f2ddfa?w=1200&q=80",
    },
    {
      name: "Vinhomes Smart City",
      description: "Đại đô thị thông minh phía Tây Hà Nội, ứng dụng công nghệ 4.0 vào quản lý vận hành. Sở hữu vườn Nhật quy mô hàng đầu Đông Nam Á.",
      address: "Đại lộ Thăng Long, Tây Mỗ, Nam Từ Liêm, Hà Nội",
      developer: "Vingroup",
      totalArea: 280, // ha
      imageUrl: "https://images.unsplash.com/photo-1574362848149-11496d93e7c7?w=1200&q=80",
    },
    {
      name: "Ecopark",
      description: "Thành phố xanh lớn nhất miền Bắc, sở hữu hệ sinh thái thiên nhiên đẳng cấp với hơn 1 triệu cây xanh.",
      address: "Xuân Quan, Văn Giang, Hưng Yên",
      developer: "Ecopark",
      totalArea: 500, // ha
      imageUrl: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=1200&q=80",
    },
    {
      name: "Aqua City",
      description: "Đô thị sinh thái thông minh phía Đông TP.HCM. Tận dụng lợi thế ba mặt giáp sông, mang lại không gian sống trong lành.",
      address: "Hương Lộ 2, Long Hưng, TP. Biên Hòa, Đồng Nai",
      developer: "Novaland",
      totalArea: 1000, // ha
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    },
    {
      name: "Sala Sarimi",
      description: "Khu căn hộ thấp tầng cao cấp nằm trong khu đô thị Sala, được bao bọc bởi công viên sinh thái 150ha.",
      address: "10 Mai Chí Thọ, An Lợi Đông, TP. Thủ Đức, TP. Hồ Chí Minh",
      developer: "Đại Quang Minh",
      totalArea: 1.56, // ha
      imageUrl: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80",
    },
    {
      name: "The River Thủ Thiêm",
      description: "Dự án căn hộ hạng sang bên sông Sài Gòn, sở hữu tầm nhìn trực diện về trung tâm Quận 1. Thiết kế sang trọng, tiện ích 6 sao.",
      address: "Đại lộ Vòng Cung, Thủ Thiêm, TP. Thủ Đức, TP. Hồ Chí Minh",
      developer: "Refico",
      totalArea: 1.5, // ha
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    },
  ];

  for (const p of projects) {
    const s = slug(p.name);
    await prisma.project.upsert({
      where: { slug: s },
      update: {},
      create: {
        name: p.name,
        slug: s,
        description: p.description,
        address: p.address,
        developer: p.developer,
        totalArea: p.totalArea, // ha to number
        imageUrl: p.imageUrl,
        isActive: true,
      },
    });
  }

  console.log("Seed done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
