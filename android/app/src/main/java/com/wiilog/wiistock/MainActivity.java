package com.wiilog.wiistock;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.wiilog.wiistock.plugins.rfid.manager.RfidManagerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RfidManagerPlugin.class);
        super.onCreate(savedInstanceState);
    }

}
