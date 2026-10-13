// Rules for saved items (pins) and merging guest saves into an account.
import { catalogService } from './catalogService';

export const savedService = {
    /** Cloud pins → ids (handles v1 name-only pins). */
    idsFromPins: (pins = []) => pins.map(catalogService.resolveSavedId).filter(Boolean),
    pinsFromIds: (ids) => ids.map(catalogService.toPin).filter(Boolean),
    toggle: (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),

    /**
     * On first sign-in, fold guest data into the account.
     * Returns the Firestore patch to write, or null if nothing to merge.
     */
    mergeGuestIntoAccount(cloudData, guestIds, guestPlan) {
        const cloudIds = savedService.idsFromPins(cloudData.pinnedPlaces);
        const extra = guestIds.filter((id) => !cloudIds.includes(id));
        const patch = {};
        if (extra.length) patch.pinnedPlaces = savedService.pinsFromIds([...cloudIds, ...extra]);
        if (guestPlan && !cloudData.travelPlan) {
            patch.travelPlan = guestPlan.text;
            patch.travelPlanMeta = guestPlan.meta ?? null;
        }
        return Object.keys(patch).length ? patch : null;
    },
};
