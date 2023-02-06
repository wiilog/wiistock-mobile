package com.wiilog.wiistock.plugins.rfid.manager.exceptions;

public class ZebraRfidException extends Exception {

    private ZebraExceptionType type;

    public ZebraRfidException(ZebraExceptionType type) {
        super(type.toString());
        this.setType(type);
    }

    public ZebraRfidException(ZebraExceptionType type, Throwable cause) {
        super(type.toString(), cause);
        this.setType(type);
    }

    public ZebraExceptionType getType() {
        return type;
    }

    public ZebraRfidException setType(ZebraExceptionType type) {
        this.type = type;
        return this;
    }

}
