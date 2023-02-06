package com.wiilog.wiistock.plugins.rfid.manager;

import android.Manifest;
import android.util.Log;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.Plugin;

import com.wiilog.wiistock.plugins.rfid.manager.exceptions.ZebraExceptionType;
import com.wiilog.wiistock.plugins.rfid.manager.exceptions.ZebraRfidException;
import com.wiilog.wiistock.plugins.rfid.manager.rfid.ZebraRfidManager;

import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
        name = "RfidManager",
        permissions = {
                @Permission(
                        strings = {Manifest.permission.BLUETOOTH},
                        alias = "BLUETOOTH"
                ),
        }
)
public class RfidManagerPlugin extends Plugin {

    private final static String LOG_TAG = "RFID_MANAGER_PLUGIN";

    private ZebraRfidManager zebraRfidManager;

    @Override
    public void load() {
        this.zebraRfidManager = new ZebraRfidManager(this);
    }

    @PluginMethod()
    public void run(PluginCall call) throws Exception {
        String action = call.getString("action");
        try {
            JSObject result = this.treatAction(action);
            call.resolve(result);
        }
        catch(ZebraRfidException exception) {
            this.resolveError(call, exception);
        }
    }

    @PluginMethod()
    public void deviceInfo(PluginCall call) {
        try {
            JSObject readerInfo = this.zebraRfidManager.getConnectedDeviceInfo();
            call.resolve(readerInfo);
        }
        catch(ZebraRfidException exception) {
            this.resolveError(call, exception);
        }
    }

    public void triggerPluginEvent(RfidEvent event, JSObject data) {
        this.notifyListeners(event.toString(), data);
    }

    private JSObject treatAction(@Nullable String action) throws ZebraRfidException {

        JSObject result = new JSObject();
        result.put("success", true);

        // prevent java.lang.NullPointerException
        if (action == null) {
            throw new ZebraRfidException(ZebraExceptionType.ACTION_REQUIRED);
        }

        Log.d(LOG_TAG, String.format("treatAction : %s", action));

        @Nullable
        RfidAction rfidAction = RfidAction.fromString(action);

        if (rfidAction == null) {
            throw new ZebraRfidException(ZebraExceptionType.ACTION_INVALID);
        }

        switch (rfidAction) {
            case CONNECT:
                this.zebraRfidManager.connect();
                break;
            case DISCONNECT:
                this.zebraRfidManager.disconnect();
                break;
            case CONFIGURE:
                this.zebraRfidManager.configure();
                break;
            case START_SCAN:
                this.zebraRfidManager.startScan();
                break;
            case STOP_SCAN:
                this.zebraRfidManager.stopScan();
                break;
            default:
                throw new ZebraRfidException(ZebraExceptionType.ACTION_INVALID);
        }

        return result;
    }

    private void resolveError(PluginCall call, ZebraRfidException exception) {
        call.reject(exception.getType().toString(), exception);
    }

}
