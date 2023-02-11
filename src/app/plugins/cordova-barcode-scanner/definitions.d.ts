export interface BarcodeScanOptions {
    preferFrontCamera: boolean;
    showFlipCameraButton: boolean;
    showTorchButton: boolean;
    torchOn: boolean;
    saveHistory: boolean;
    prompt: string;
    resultDisplayDuration: number; // Display scanned text for X ms. 0 suppresses it entirely, default 1500
    formats: string; // default: all but PDF_417 and RSS_EXPANDED
    orientation: "landscape"|"portrait"; // Android only (portrait|landscape), default unset so it rotates with the device
    disableSuccessBeep: boolean;
}


export interface BarcodeScanResult {
    format: 'QR_CODE' | 'DATA_MATRIX' | 'UPC_E' | 'UPC_A' | 'EAN_8' | 'EAN_13' | 'CODE_128' | 'CODE_39' | 'CODE_93' | 'CODABAR' | 'ITF' | 'RSS14' | 'RSS_EXPANDED' | 'PDF_417' | 'AZTEC' | 'MSI';
    cancelled: boolean;
    text: string;
}

/*
Available barcode formats, give it to format attributes separate with ","

    QR_CODE
    DATA_MATRIX
    UPC_A
    UPC_E
    EAN_8
    EAN_13
    CODE_39
    CODE_93
    CODE_120
    CODABAR
    ITF
    RSS14
    PDF_417
    RSS_EXPANDED
    AZTEC
 */
