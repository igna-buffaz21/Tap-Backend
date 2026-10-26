export declare const RESOURCE_SELECTION_MODES: readonly ["AUTO", "OPTIONAL", "REQUIRED"];
export type ResourceSelectionMode = (typeof RESOURCE_SELECTION_MODES)[number];
export interface ResourcePreferences {
    isIndoor?: boolean;
}
