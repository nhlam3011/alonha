
import { prisma } from "@/lib/prisma";
import { toListingCard } from "@/lib/listings";
import { Listing, Project } from "@prisma/client";

const MAX_COMPARE_ITEMS = 3;

export type CompareContext = {
    userId: string | null;
    sessionId: string | null;
    shouldSetCookie: boolean;
};

export function groupWhere(context: CompareContext) {
    if (context.userId) return { userId: context.userId };
    return { sessionId: context.sessionId! };
}

export async function getOrCreateGroup(context: CompareContext) {
    const existing = await prisma.compareGroup.findFirst({
        where: groupWhere(context),
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });
    if (existing) return existing;

    return prisma.compareGroup.create({
        data: context.userId ? { userId: context.userId } : { sessionId: context.sessionId },
        select: { id: true },
    });
}

export async function getCompareItems(context: CompareContext) {
    const group = await prisma.compareGroup.findFirst({
        where: groupWhere(context),
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    if (!group) return [];

    const rows = await prisma.compareGroupItem.findMany({
        where: { compareGroupId: group.id },
        orderBy: { order: "asc" },
        include: {
            listing: {
                include: {
                    images: { select: { url: true, isPrimary: true }, orderBy: { order: "asc" } },
                    project: { select: { name: true } },
                },
            },
        },
    });

    return rows
        .filter((row) => row.listing.status === "APPROVED" && !!row.listing.publishedAt)
        .map((row) => {
            // Cast to satisfy toListingCard requirement. 
            // The include above fetches images which aligns with ListingWithRelations in lib/listings
            const listing = row.listing as unknown as Listing & { images: { url: string; isPrimary: boolean }[] } & { project: Project | null };

            const location =
                [listing.wardName, listing.provinceName]
                    .filter(Boolean)
                    .join(", ") || listing.address;

            return {
                id: row.id,
                listingId: row.listingId,
                order: row.order,
                listing: {
                    ...toListingCard(listing),
                    status: listing.status,
                    address: listing.address,
                    location,
                    direction: listing.direction,
                    legalStatus: listing.legalStatus,
                    furniture: listing.furniture,
                    projectName: listing.project?.name ?? null,
                    createdAt: listing.createdAt.toISOString(),
                    updatedAt: listing.updatedAt.toISOString(),
                },
            };
        });
}

export type AddToCompareResult = {
    ok: boolean;
    message?: string;
    error?: string;
    total: number;
    maxItems: number;
};

export async function addToCompare(
    context: CompareContext,
    listingId?: string,
    slug?: string
): Promise<AddToCompareResult> {
    const listingIdInput = listingId?.trim();
    const slugInput = slug?.trim();
    if (!listingIdInput && !slugInput) {
        return { ok: false, error: "Thiếu listingId hoặc slug.", total: 0, maxItems: MAX_COMPARE_ITEMS };
    }

    const listing = listingIdInput
        ? await prisma.listing.findUnique({
            where: { id: listingIdInput },
            select: { id: true, status: true, publishedAt: true },
        })
        : await prisma.listing.findUnique({
            where: { slug: slugInput! },
            select: { id: true, status: true, publishedAt: true },
        });

    if (!listing || listing.status !== "APPROVED" || !listing.publishedAt) {
        return { ok: false, error: "Tin đăng không hợp lệ để so sánh.", total: 0, maxItems: MAX_COMPARE_ITEMS };
    }

    const group = await getOrCreateGroup(context);

    // We need to fetch existing items to check count and duplicates
    // We also need to check if they are still valid (APPROVED)
    const existingItems = await prisma.compareGroupItem.findMany({
        where: { compareGroupId: group.id },
        orderBy: { order: "asc" },
        include: {
            listing: {
                select: { status: true, publishedAt: true }
            }
        }
    });

    const staleItemIds = existingItems
        .filter((item) => item.listing.status !== "APPROVED" || !item.listing.publishedAt)
        .map((item) => item.id);

    if (staleItemIds.length) {
        await prisma.compareGroupItem.deleteMany({
            where: {
                compareGroupId: group.id,
                id: { in: staleItemIds },
            },
        });
    }

    const activeItems = existingItems.filter(
        (item) => item.listing.status === "APPROVED" && !!item.listing.publishedAt
    );

    if (activeItems.some((item) => item.listingId === listing.id)) {
        return {
            ok: true,
            message: "Tin đã có trong danh sách so sánh.",
            total: activeItems.length,
            maxItems: MAX_COMPARE_ITEMS,
        };
    }

    if (activeItems.length >= MAX_COMPARE_ITEMS) {
        return {
            ok: false,
            error: `Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} tin.`,
            total: activeItems.length,
            maxItems: MAX_COMPARE_ITEMS,
        };
    }

    await prisma.compareGroupItem.create({
        data: {
            compareGroupId: group.id,
            listingId: listing.id,
            order: activeItems.length,
        },
    });

    return {
        ok: true,
        message: "Đã thêm vào so sánh.",
        total: activeItems.length + 1,
        maxItems: MAX_COMPARE_ITEMS,
    };
}

export async function removeFromCompare(context: CompareContext, listingId?: string) {
    const group = await prisma.compareGroup.findFirst({
        where: groupWhere(context),
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });
    if (!group) return 0;

    if (listingId) {
        await prisma.compareGroupItem.deleteMany({
            where: { compareGroupId: group.id, listingId },
        });
    } else {
        await prisma.compareGroupItem.deleteMany({
            where: { compareGroupId: group.id },
        });
    }

    const remaining = await prisma.compareGroupItem.findMany({
        where: { compareGroupId: group.id },
        orderBy: { order: "asc" },
        select: { id: true },
    });

    await Promise.all(
        remaining.map((item, index) =>
            prisma.compareGroupItem.update({
                where: { id: item.id },
                data: { order: index },
            })
        )
    );

    return remaining.length;
}
