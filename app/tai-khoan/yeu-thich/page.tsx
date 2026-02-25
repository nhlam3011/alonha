"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PropertyCard } from "@/components/listings/PropertyCard";
import type { ListingCardData } from "@/components/listings/PropertyCard";

export default function FavoritesPage() {
  const { status } = useSession();
  const [list, setList] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  if (status === "unauthenticated") redirect("/dang-nhap?callbackUrl=/tai-khoan/yeu-thich");
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((res) => res.data && setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") return <div className="p-8 text-center text-[var(--muted)]">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Tin đã lưu</h1>
      {loading ? (
        <div className="mt-6 text-[var(--muted)]">Đang tải...</div>
      ) : list.length === 0 ? (
        <p className="mt-6 text-[var(--muted)]">Chưa lưu tin nào. <Link href="/bat-dong-san" className="text-[var(--primary)] hover:underline">Xem tin đăng</Link></p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
