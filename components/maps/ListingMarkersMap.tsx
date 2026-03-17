"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      const docTheme = document.documentElement.getAttribute("data-theme");
      setTheme(docTheme === "dark" ? "dark" : "light");
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return theme;
}

export type MapListingPoint = {
  id: string;
  slug: string;
  title: string;
  address?: string | null;
  price: number;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  listingType: "SALE" | "RENT";
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
};

type ListingMarkersMapProps = {
  listings: MapListingPoint[];
  selectedListingId: string | null;
  onSelectListing: (listingId: string) => void;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  hoveredListingId?: string | null;
};

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623];

function formatPriceShort(value: number): string {
  if (value <= 0) return "LH";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}tỷ`;
  if (value >= 1e6) return `${Math.round(value / 1e6)}tr`;
  return `${(value / 1000).toFixed(0)}k`;
}

function formatPriceFull(value: number): string {
  if (value <= 0) return "Thỏa thuận";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} tỷ`;
  if (value >= 1e6) return `${Math.round(value / 1e6)} triệu`;
  return `${value.toLocaleString("vi-VN")} đ`;
}

function createPriceIcon(
  price: number,
  isSelected: boolean,
  isHovered: boolean,
  listingType: "SALE" | "RENT",
  theme: "light" | "dark"
) {
  const text = formatPriceShort(price);
  const isSale = listingType === "SALE";
  const active = isSelected || isHovered;

  const saleColor = theme === "dark" ? "#f87171" : "#ef4444";
  const rentColor = theme === "dark" ? "#60a5fa" : "#2563eb";
  const bgLight = theme === "dark" ? "#1e293b" : "#ffffff";

  const bg = active ? (isSale ? saleColor : rentColor) : bgLight;
  const color = active ? "#ffffff" : (isSale ? saleColor : rentColor);
  const border = active
    ? "transparent"
    : (isSale ? (theme === "dark" ? "#991b1b" : "#fecaca") : (theme === "dark" ? "#1e40af" : "#bfdbfe"));
  const shadow = active
    ? (theme === "dark" ? "0 4px 14px rgba(0,0,0,.5)" : "0 4px 14px rgba(0,0,0,.3)")
    : (theme === "dark" ? "0 2px 8px rgba(0,0,0,.4)" : "0 2px 8px rgba(0,0,0,.12)");
  const scale = active ? "scale(1.15)" : "scale(1)";

  return L.divIcon({
    className: "",
    html: `<div style="
      background:${bg};color:${color};border:2px solid ${border};
      padding:4px 10px;border-radius:20px;font-weight:700;font-size:12px;
      white-space:nowrap;cursor:pointer;box-shadow:${shadow};
      transform:${scale};transition:all .2s ease;
      display:inline-flex;align-items:center;justify-content:center;
      font-family:system-ui,-apple-system,sans-serif;line-height:1.2;
      pointer-events:auto;
    ">${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [28, 14],
    popupAnchor: [0, -20],
  });
}

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { try { map.invalidateSize(); } catch { } }, 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitAllMarkers({ listings, hasExternalFly }: { listings: MapListingPoint[]; hasExternalFly: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (hasExternalFly) return;
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
        if (listings.length === 0) { map.setView(DEFAULT_CENTER, 6); return; }
        if (listings.length === 1) { map.setView([listings[0].latitude, listings[0].longitude], 15); return; }
        const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude] as [number, number]));
        map.fitBounds(bounds.pad(0.12), { maxZoom: 16, animate: true });
      } catch { }
    }, 150);
    return () => clearTimeout(t);
  }, [listings, map, hasExternalFly]);
  return null;
}

function FlyToArea({ location }: { location: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  const prevKey = useRef("");
  useEffect(() => {
    if (!location) return;
    const key = `${location.lat},${location.lng}`;
    if (key === prevKey.current) return;
    prevKey.current = key;
    const t = setTimeout(() => {
      try { map.flyTo([location.lat, location.lng], location.zoom ?? 14, { duration: 1.2 }); } catch { }
    }, 200);
    return () => clearTimeout(t);
  }, [location, map]);
  return null;
}

/**
 * Khi hover listing từ panel bên trái, chỉ panTo nhẹ (không zoom)
 * để marker nằm trong viewport, tránh bay mạnh.
 */
function PanToHovered({ listingId, listings }: { listingId: string | null | undefined; listings: MapListingPoint[] }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId || prevId.current === listingId) return;
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    prevId.current = listingId;

    // Chỉ pan nếu marker ngoài viewport, không thay đổi zoom
    const pos = L.latLng(listing.latitude, listing.longitude);
    if (!map.getBounds().contains(pos)) {
      map.panTo(pos, { animate: true, duration: 0.4 });
    }
  }, [listingId, listings, map]);

  return null;
}

/**
 * Khi click vào marker, bay đến và zoom vào vị trí đó
 */
function FocusSelected({ listingId, listings }: { listingId: string | null; listings: MapListingPoint[] }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId || prevId.current === listingId) return;
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    prevId.current = listingId;

    // Bay đến và zoom vào marker được chọn
    const t = setTimeout(() => {
      try {
        map.flyTo([listing.latitude, listing.longitude], 16, { duration: 0.5 });
      } catch { }
    }, 50);
    return () => clearTimeout(t);
  }, [listingId, listings, map]);

  return null;
}

function LocateButton() {
  const map = useMap();
  const [busy, setBusy] = useState(false);
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { map.flyTo([p.coords.latitude, p.coords.longitude], 15, { duration: 1 }); setBusy(false); },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map]);

  return (
    <button
      onClick={locate}
      disabled={busy}
      className="absolute bottom-20 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] shadow-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all hover:shadow-xl disabled:opacity-50"
      title="Vị trí của tôi"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg>
      )}
    </button>
  );
}

function ResetButton({ listings }: { listings: MapListingPoint[] }) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        if (listings.length === 0) { map.setView(DEFAULT_CENTER, 6); return; }
        const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude] as [number, number]));
        map.fitBounds(bounds.pad(0.12), { maxZoom: 16, animate: true });
      }}
      className="absolute bottom-9 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] shadow-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all hover:shadow-xl"
      title="Xem tất cả"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
    </button>
  );
}

export default function ListingMarkersMap({
  listings,
  selectedListingId,
  onSelectListing,
  flyToLocation,
  hoveredListingId,
}: ListingMarkersMapProps) {
  const theme = useTheme();
  const hasExternalFly = flyToLocation != null;

  const center = flyToLocation
    ? ([flyToLocation.lat, flyToLocation.lng] as [number, number])
    : listings.length > 0
      ? ([listings[0].latitude, listings[0].longitude] as [number, number])
      : DEFAULT_CENTER;

  // Theme-aware colors for popup
  const popupBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const popupText = theme === "dark" ? "#f1f5f9" : "#0f172a";
  const popupMuted = theme === "dark" ? "#94a3b8" : "#64748b";
  const popupPlaceholder = theme === "dark" ? "#334155" : "#f1f5f9";
  const popupPlaceholderText = theme === "dark" ? "#64748b" : "#94a3b8";
  const saleColor = theme === "dark" ? "#f87171" : "#ef4444";
  const rentColor = theme === "dark" ? "#60a5fa" : "#2563eb";
  const priceColor = theme === "dark" ? "#f87171" : "#ef4444";

  return (
    <MapContainer
      center={center}
      zoom={flyToLocation?.zoom ?? 10}
      className="h-full w-full outline-none"
      scrollWheelZoom={false}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      />
      <MapReady />
      <FitAllMarkers listings={listings} hasExternalFly={hasExternalFly} />
      <FlyToArea location={flyToLocation ?? null} />
      <PanToHovered listingId={hoveredListingId} listings={listings} />
      <FocusSelected listingId={selectedListingId} listings={listings} />
      <LocateButton />
      <ResetButton listings={listings} />

      {listings.map((item) => {
        const isSelected = item.id === selectedListingId;
        const isHovered = item.id === hoveredListingId;

        return (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={createPriceIcon(item.price, isSelected, isHovered, item.listingType, theme)}
            eventHandlers={{
              click: () => onSelectListing(item.id),
              mouseover: (e) => { e.target.openPopup(); },
              mouseout: (e) => { e.target.closePopup(); },
            }}
            zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
          >
            <Popup closeButton={false} offset={[0, -16]} maxWidth={260} minWidth={230} className="minimal-popup" autoPan={false}>
              <Link href={`/bat-dong-san/${item.slug}`} className="block w-[230px]" style={{ textDecoration: "none" }}>
                <div className="overflow-hidden rounded-xl" style={{ background: popupBg, boxShadow: theme === "dark" ? "0 8px 30px rgba(0,0,0,.5)" : "0 8px 30px rgba(0,0,0,.15)" }}>
                  {/* Image */}
                  {item.imageUrl ? (
                    <div style={{ position: "relative", height: "120px", width: "100%", overflow: "hidden" }}>
                      <img src={item.imageUrl} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} loading="lazy" />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
                      <span style={{
                        position: "absolute", top: "8px", left: "8px",
                        borderRadius: "6px", padding: "3px 8px",
                        fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.03em",
                        background: item.listingType === "SALE" ? saleColor : rentColor,
                        backdropFilter: "blur(4px)",
                      }}>
                        {item.listingType === "SALE" ? "BÁN" : "THUÊ"}
                      </span>
                      {/* Price overlay on image */}
                      <div style={{
                        position: "absolute", bottom: "8px", left: "8px",
                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                        borderRadius: "8px", padding: "4px 10px",
                      }}>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>
                          {formatPriceFull(item.price)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      height: "80px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: popupPlaceholder, color: popupPlaceholderText
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ padding: "10px 12px 12px" }}>
                    <p style={{
                      margin: 0, fontSize: "13px", fontWeight: 600, color: popupText,
                      lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {item.title}
                    </p>
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: popupMuted }}>
                      {item.area && item.area > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                          {item.area}m²
                        </span>
                      )}
                      {item.bedrooms && item.bedrooms > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          {item.bedrooms} PN
                        </span>
                      )}
                      {item.bathrooms && item.bathrooms > 0 && <span>{item.bathrooms} WC</span>}
                    </div>
                    {item.address && (
                      <p style={{
                        margin: "6px 0 0", fontSize: "11px", color: popupMuted,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                        {item.address}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
