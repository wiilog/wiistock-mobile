package com.wiilog.wiistock.plugins.battery.manager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(
        name = "BatteryManager"
)
public class BatteryManagerPlugin extends Plugin {

    @Override
    public void load() {
        BatteryManagerPlugin plugin = this;

        BroadcastReceiver mBatInfoReceiver = new BroadcastReceiver(){
            @Override
            public void onReceive(Context ctxt, Intent intent) {
                plugin.notifyListeners("stateChanged", plugin.getBatteryInfo(intent));
            }
        };

        plugin.getActivity().registerReceiver(mBatInfoReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    }

    @PluginMethod()
    public void batteryInfo(PluginCall call) throws Exception {
        Intent receiver = this.getActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        call.resolve(this.getBatteryInfo(receiver));
    }

    private JSObject getBatteryInfo(Intent intent) {
        int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

        float batteryValue = level * 100 / (float) scale;

        int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL;

        int chargePlug = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1);
        String powerSourceValue =  (
            chargePlug == BatteryManager.BATTERY_PLUGGED_WIRELESS ? "wireless" :
            (chargePlug == BatteryManager.BATTERY_PLUGGED_USB ? "usb" :
            (chargePlug == BatteryManager.BATTERY_PLUGGED_AC ? "ac" : null))
        );

        JSObject result = new JSObject();
        result.put("plugged", isCharging);
        result.put("source", powerSourceValue);
        result.put("level", batteryValue);
        return result;
    }

}
