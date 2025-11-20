// helper/mixProfessionalsWithPromotions.ts

import { HealthcareProfessional } from "@/types/auth.d";
import { PromotedItem } from "@/types/promoted.d";

export type MixedFeedItem =
    | { type: 'professional'; data: HealthcareProfessional }
    | { type: 'promoted'; data: PromotedItem };

export const mixProfessionalsWithPromotions = (
    professionals: HealthcareProfessional[],
    promotedItems: PromotedItem[],
    options: {
        interval?: number;     // Insert every N professionals (default: 4)
        maxPromoted?: number;  // Max promoted items to show
        shufflePromoted?: boolean;
    } = {}
): MixedFeedItem[] => {
    const {
        interval = 4,
        maxPromoted = 3,
        shufflePromoted = true
    } = options;

    if (professionals.length === 0) return [];

    // Shuffle promoted items so it's not always the same
    const shuffledPromoted = shufflePromoted
        ? [...promotedItems].sort(() => Math.random() - 0.5)
        : promotedItems;

    const result: MixedFeedItem[] = [];
    let promotedIndex = 0;

    professionals.forEach((prof, index) => {
        // Add professional
        result.push({ type: 'professional', data: prof });

        // Insert promoted item after every `interval` professionals
        if ((index + 1) % interval === 0 && promotedIndex < maxPromoted && promotedIndex < shuffledPromoted.length) {
            result.push({
                type: 'promoted',
                data: shuffledPromoted[promotedIndex]
            });
            promotedIndex++;
        }
    });

    // Optional: Add one at the end if list is long
    if (professionals.length >= interval * 2 && promotedIndex < maxPromoted && promotedIndex < shuffledPromoted.length) {
        result.push({
            type: 'promoted',
            data: shuffledPromoted[promotedIndex]
        });
    }

    return result;
};