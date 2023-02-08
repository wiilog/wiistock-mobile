package com.wiilog.wiistock.plugins.rfid.manager.rfid;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.wiilog.wiistock.plugins.rfid.manager.RfidEvent;
import com.wiilog.wiistock.plugins.rfid.manager.RfidManagerPlugin;
import com.wiilog.wiistock.plugins.rfid.manager.exceptions.ZebraExceptionType;
import com.wiilog.wiistock.plugins.rfid.manager.exceptions.ZebraRfidException;
import com.zebra.rfid.api3.COMMUNICATION_STANDARD;
import com.zebra.rfid.api3.ENUM_TRANSPORT;
import com.zebra.rfid.api3.Events;
import com.zebra.rfid.api3.InvalidUsageException;
import com.zebra.rfid.api3.OperationFailureException;
import com.zebra.rfid.api3.RFIDReader;
import com.zebra.rfid.api3.RFIDResults;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfid.api3.Readers;
import com.zebra.rfid.api3.RfidEventsListener;
import com.zebra.rfid.api3.START_TRIGGER_TYPE;
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE;
import com.zebra.rfid.api3.TriggerInfo;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

public class ZebraRfidManager {

    private final static List<RfidEventsListener> RFID_EVENTS_LISTENERS = new ArrayList<>();

    private final static String LOG_TAG = "ZEBRA_RFID_MANAGER";

    private ReaderDevice connectedDevice;
    private RFIDReader connectedReader;
    private final RfidManagerPlugin plugin;

    public ZebraRfidManager(RfidManagerPlugin plugin) {
        this.plugin = plugin;
    }

    public void connect() throws ZebraRfidException {
        if (this.connectedReader != null && this.connectedReader.isConnected()) {
            throw new ZebraRfidException(ZebraExceptionType.READER_ALREADY_CONNECTED);
        }

        if (this.connectedReader == null) {
            Activity activity = this.plugin.getActivity();
            Readers readers = new Readers(activity, ENUM_TRANSPORT.BLUETOOTH);

            // TODO order : appeared in first positions ?

            List<ReaderDevice> availableReaders;

            try {
                availableReaders = readers.GetAvailableRFIDReaderList();
            }
            catch (InvalidUsageException exception) {
                Log.e(LOG_TAG, String.format("connect GetAvailableRFIDReaderList: %s", exception.getMessage()));
                throw new ZebraRfidException(ZebraExceptionType.RETRIEVE_AVAILABLE_READERS_LIST_FAILURE, exception);
            }

            if (availableReaders.isEmpty()) {
                throw new ZebraRfidException(ZebraExceptionType.NO_READER_FOUND);
            }

            this.connectedDevice = availableReaders.get(0);
            this.connectedReader = this.connectedDevice.getRFIDReader();

            if (this.connectedDevice == null || this.connectedReader == null) {
                throw new ZebraRfidException(ZebraExceptionType.READER_CONNECTION_FAILURE);
            }

            try {
                if (!this.connectedReader.isConnected()) {
                    this.connectedReader.connect();
                }
//                readers.Dispose(); // TODO NEEDED ?
            } catch (OperationFailureException exception) {
                Log.e(LOG_TAG, String.format("connect : %s", exception.getResults().toString()));
                this.connectedDevice = null;
                this.connectedReader = null;
                if (exception.getResults() == RFIDResults.RFID_READER_REGION_NOT_CONFIGURED) {
                    throw new ZebraRfidException(ZebraExceptionType.READER_CONNECTION_FAILURE_NOT_CONFIGURED, exception);
                }
                else {
                    throw new ZebraRfidException(ZebraExceptionType.READER_CONNECTION_FAILURE, exception);
                }
            } catch (InvalidUsageException exception) {
                Log.e(LOG_TAG, String.format("connect InvalidUsageException : %s", exception.getMessage()));
                this.connectedDevice = null;
                this.connectedReader = null;
                throw new ZebraRfidException(ZebraExceptionType.READER_CONNECTION_FAILURE, exception);
            }
        }
    }

    public void disconnect() throws ZebraRfidException {
        if (this.connectedReader == null || !this.connectedReader.isConnected()) {
            this.connectedReader = null;
            throw new ZebraRfidException(ZebraExceptionType.READER_ALREADY_DISCONNECTED);
        }

        try {
            this.stopScan();
        }
        catch(Exception e) { /* ignored */ }
        try {
            this.connectedReader.disconnect();
            this.connectedReader = null;
            this.connectedDevice = null;
        } catch (InvalidUsageException|OperationFailureException exception) {
            throw new ZebraRfidException(ZebraExceptionType.READER_DISCONNECTION_FAILURE, exception);
        }
    }

    public void configure() throws ZebraRfidException {
        this.checkReaderAvailability();

        TriggerInfo triggerInfo = new TriggerInfo();
        triggerInfo.StartTrigger.setTriggerType(START_TRIGGER_TYPE.START_TRIGGER_TYPE_IMMEDIATE);
        triggerInfo.StopTrigger.setTriggerType(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE);

        try {
            // set start and stop triggers
            ZebraRfidManager.ClearEventListener(this.connectedReader.Events);
            ZebraRfidEvent eventHandler = new ZebraRfidEvent(this);
            this.connectedReader.Events.addEventsListener(eventHandler);
            RFID_EVENTS_LISTENERS.add(eventHandler);

            this.connectedReader.Config.setStartTrigger(triggerInfo.StartTrigger);
            this.connectedReader.Config.setStopTrigger(triggerInfo.StopTrigger);

            this.connectedReader.Events.setInventoryStopEvent(true);
            this.connectedReader.Events.setInventoryStartEvent(true);
            this.connectedReader.Events.setTagReadEvent(true);
            this.connectedReader.Events.setAttachTagDataWithReadEvent(false);
            // others available methods
            this.connectedReader.Events.setBatchModeEvent(true);
            this.connectedReader.Events.setReaderDisconnectEvent(true); // TODO ?
            this.connectedReader.Events.setBatteryEvent(true);
            this.connectedReader.Events.setHandheldEvent(true);
            this.connectedReader.Events.setScanDataEvent(true);

        } catch (OperationFailureException exception) {
            Log.e(LOG_TAG, exception.getResults().toString());
            throw new ZebraRfidException(ZebraExceptionType.READER_CONFIGURATION_FAILED, exception);
        } catch (InvalidUsageException exception) {
            throw new ZebraRfidException(ZebraExceptionType.READER_CONFIGURATION_FAILED, exception);
        }
    }

    public void triggerTagsReadEvent(String[] data) {
        try {
            JSObject result = new JSObject();
            result.put("tags", new JSArray(data));
            this.plugin.triggerPluginEvent(RfidEvent.TAGS_READ, result);
        } catch (JSONException e) {
            // do nothing
        }
    }

    public void triggerScanStartedEvent() {
        this.plugin.triggerPluginEvent(RfidEvent.SCAN_STARTED, null);
    }

    public void triggerScanStoppedEvent() {
        this.plugin.triggerPluginEvent(RfidEvent.SCAN_STOPPED, null);
    }


    public void startScan() throws ZebraRfidException {
        this.checkReaderAvailability();
        // TODO timed out ?
        
        try {
            this.connectedReader.Actions.Inventory.perform();
        } catch (OperationFailureException exception) {
            Log.e(LOG_TAG, String.format("startScan : OperationFailureException - %s", exception.getResults().toString()));
            if (exception.getResults() == RFIDResults.RFID_INVENTORY_IN_PROGRESS) {
                throw new ZebraRfidException(ZebraExceptionType.SCAN_START_FAILED_INVENTORY_ALREADY_IN_PROGRESS, exception);
            }
            throw new ZebraRfidException(ZebraExceptionType.SCAN_START_FAILED, exception);
        } catch (InvalidUsageException exception) {
            Log.e(LOG_TAG, "startScan : InvalidUsageException");
            throw new ZebraRfidException(ZebraExceptionType.SCAN_START_FAILED, exception);
        }
    }

    public void stopScan() throws ZebraRfidException {
        this.checkReaderAvailability();

        try {
            this.connectedReader.Actions.Inventory.stop();
        }
        catch (OperationFailureException exception) {
            Log.e(LOG_TAG, String.format("stopScan : OperationFailureException - %s", exception.getResults().toString()));
            if (exception.getResults() == RFIDResults.RFID_NO_INVENTORY_IN_PROGRESS) {
                throw new ZebraRfidException(ZebraExceptionType.SCAN_STOP_FAILED_NO_INVENTORY_IN_PROGRESS, exception);
            }
            throw new ZebraRfidException(ZebraExceptionType.SCAN_STOP_FAILED, exception);
        }
        catch (InvalidUsageException exception) {
            throw new ZebraRfidException(ZebraExceptionType.SCAN_STOP_FAILED, exception);
        }
    }

    public JSObject getConnectedDeviceInfo() throws ZebraRfidException {
        this.checkReaderAvailability();

        JSObject readerObject = new JSObject();
        COMMUNICATION_STANDARD communicationStandard = this.connectedReader.ReaderCapabilities.getCommunicationStandard();
        readerObject
                .put("id", this.connectedReader.ReaderCapabilities.ReaderID.getID())
                .put("modelName", this.connectedReader.ReaderCapabilities.getModelName())
                .put("communicationStandard", communicationStandard != null ? communicationStandard.toString() : null)
                .put("countryCode", this.connectedReader.ReaderCapabilities.getCountryCode())
                .put("firmwareVersion", this.connectedReader.ReaderCapabilities.getFirwareVersion())
                .put("RSSIFilter", this.connectedReader.ReaderCapabilities.isRSSIFilterSupported())
                .put("tagEventReporting", this.connectedReader.ReaderCapabilities.isTagEventReportingSupported())
                .put("tagLocatingReporting", this.connectedReader.ReaderCapabilities.isTagLocationingSupported())
                .put("NXPCommandSupport", this.connectedReader.ReaderCapabilities.isNXPCommandSupported())
                .put("blockEraseSupport", this.connectedReader.ReaderCapabilities.isBlockEraseSupported())
                .put("blockWriteSupport", this.connectedReader.ReaderCapabilities.isBlockWriteSupported())
                .put("blockPermalockSupport", this.connectedReader.ReaderCapabilities.isBlockPermalockSupported())
                .put("recommisionSupport", this.connectedReader.ReaderCapabilities.isRecommisionSupported())
                .put("writeWMISupport", this.connectedReader.ReaderCapabilities.isWriteUMISupported())
                .put("radioPowerControlSupport", this.connectedReader.ReaderCapabilities.isRadioPowerControlSupported())
                .put("hoppingEnabled", this.connectedReader.ReaderCapabilities.isHoppingEnabled())
                .put("stateAwareSingulationCapable", this.connectedReader.ReaderCapabilities.isTagInventoryStateAwareSingulationSupported())
                .put("UTCClockCapable", this.connectedReader.ReaderCapabilities.isUTCClockSupported())
                .put("numOperationsInAccessSequence", this.connectedReader.ReaderCapabilities.getMaxNumOperationsInAccessSequence())
                .put("numPreFilters", this.connectedReader.ReaderCapabilities.getMaxNumPreFilters())
                .put("numAntennaSupported", this.connectedReader.ReaderCapabilities.getNumAntennaSupported());

        JSObject result = new JSObject();
        result
                .put("reader", readerObject)
                .put("address", this.connectedDevice.getAddress())
                .put("name", this.connectedDevice.getName())
                .put("serialNumber", this.connectedDevice.getSerialNumber())
                .put("transport", this.connectedDevice.getTransport());

        return result;
    }

    private void checkReaderAvailability() throws ZebraRfidException {
        if (this.connectedDevice == null
                || this.connectedReader == null
                || !this.connectedReader.isConnected()) {
            this.connectedDevice = null;
            this.connectedReader = null;
            throw new ZebraRfidException(ZebraExceptionType.READER_NOT_CONNECTED);
        }
    }

    public RFIDReader getConnectedReader() {
        return this.connectedReader;
    }

    private static void ClearEventListener(Events events) {
        if (!ZebraRfidManager.RFID_EVENTS_LISTENERS.isEmpty()) {
            for (RfidEventsListener listener: ZebraRfidManager.RFID_EVENTS_LISTENERS) {
                try {
                    events.removeEventsListener(listener);
                }
                catch (Exception ignored) {
                    /* ignored */
                }
            }
            ZebraRfidManager.RFID_EVENTS_LISTENERS.clear();
        }
    }

    private void tryReaderConnect(RFIDReader reader,
                                  RFIDResults[] availableExceptionForRetry,
                                  int retryNumber) throws ZebraRfidException {

    }


}
