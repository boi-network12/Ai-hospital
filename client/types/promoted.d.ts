// types/promoted.ts
export type PromotedItemType = 'hospital' | 'emergency' | 'clinic' | 'pharmacy';

export interface PromotedItem {
    id: string;
    type: PromotedItemType;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    websiteUrl: string; // Required: opens in browser
    callToAction?: string;
    sponsored?: boolean;
}