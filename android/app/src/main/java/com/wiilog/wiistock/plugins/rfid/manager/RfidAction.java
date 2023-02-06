package com.wiilog.wiistock.plugins.rfid.manager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Arrays;


public enum RfidAction {

    CONNECT("connect"),
    DISCONNECT("disconnect"),
    CONFIGURE("configure"),
    START_SCAN("startScan"),
    STOP_SCAN("stopScan");

    private final String value;

    RfidAction(String value) {
        this.value = value;
    }

    @NonNull
    public String toString() {
        return this.value;
    }

    @Nullable
    public static RfidAction fromString(String value) {
        return Arrays.stream(values())
                .filter(action -> action.toString().equals(value))
                .findFirst()
                .orElse(null);
    }

}
