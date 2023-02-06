package com.wiilog.wiistock.plugins.rfid.manager;

import androidx.annotation.NonNull;

public enum RfidEvent {

    TAGS_READ("tagsRead"),
    SCAN_STARTED("scanStarted"),
    SCAN_STOPPED("scanStopped");

    private final String value;

    RfidEvent(String value) {
        this.value = value;
    }

    @NonNull
    public String toString() {
        return this.value;
    }
}

