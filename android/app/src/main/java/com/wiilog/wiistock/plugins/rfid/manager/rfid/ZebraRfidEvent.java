package com.wiilog.wiistock.plugins.rfid.manager.rfid;

import android.util.Log;

import com.zebra.rfid.api3.Events;
import com.zebra.rfid.api3.HANDHELD_TRIGGER_EVENT_TYPE;
import com.zebra.rfid.api3.RFIDReader;
import com.zebra.rfid.api3.RfidEventsListener;
import com.zebra.rfid.api3.RfidReadEvents;
import com.zebra.rfid.api3.RfidStatusEvents;
import com.zebra.rfid.api3.STATUS_EVENT_TYPE;
import com.zebra.rfid.api3.TagData;

import java.util.Arrays;

import com.wiilog.wiistock.plugins.rfid.manager.exceptions.ZebraRfidException;

public class ZebraRfidEvent implements RfidEventsListener {

    private static final String LOG_TAG = "ZEBRA_RFID_EVENT";

    private final RFIDReader reader;
    private final ZebraRfidManager zebraRfidManager;

    public ZebraRfidEvent(ZebraRfidManager rfidManager) {
        this.zebraRfidManager = rfidManager;
        this.reader = rfidManager.getConnectedReader();
    }

    @Override
    public void eventReadNotify(RfidReadEvents events) {
        Log.d(LOG_TAG, "eventReadNotify");
        TagData[] tags = reader.Actions.getReadTags(100);
        if (tags != null && tags.length > 0) {
            String[] tagIds = Arrays
                    .stream(tags)
                    .map(TagData::getTagID)
                    .toArray(String[]::new);
            this.zebraRfidManager.triggerTagsReadEvent(tagIds);
        }
    }

    @Override
    public void eventStatusNotify(RfidStatusEvents events) {

        // TODO reconnect if scanner disconnected ??

        Events.StatusEventData statusEventData = events.StatusEventData;
        STATUS_EVENT_TYPE statusEventType = statusEventData.getStatusEventType();

        Log.d(LOG_TAG, String.format("eventStatusNotify : %s", statusEventType.toString()));
        if (statusEventType == STATUS_EVENT_TYPE.INVENTORY_START_EVENT) {
            this.zebraRfidManager.triggerScanStartedEvent();
        }
        else if (statusEventType == STATUS_EVENT_TYPE.INVENTORY_STOP_EVENT) {
            this.zebraRfidManager.triggerScanStoppedEvent();
        }
        else {
            HANDHELD_TRIGGER_EVENT_TYPE handheldEventType = statusEventData.HandheldTriggerEventData.getHandheldEvent();
            if (handheldEventType == HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_PRESSED) {
                try {// TODo TIMEOUT ?
                    this.zebraRfidManager.startScan();
                } catch (ZebraRfidException e) {
                    // TODO ?
                }
            }
            else if (handheldEventType == HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_RELEASED){
                try {
                    this.zebraRfidManager.stopScan();
                } catch (ZebraRfidException e) {
                    // TODO ?
                }
            }
        }

    }
}