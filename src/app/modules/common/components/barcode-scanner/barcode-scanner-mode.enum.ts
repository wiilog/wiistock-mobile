export enum BarcodeScannerModeEnum {
    ONLY_MANUAL,
    ONLY_SCAN,
    WITH_MANUAL,
    TOOL_SEARCH, // Only with search and scan buttons
    TOOL_SELECTED_LABEL, // With selected label and scan buttons
    TOOLS_FULL, // With search and creation form
    ONLY_SEARCH, // Only with search button
    INVISIBLE, // Without any icon
}
