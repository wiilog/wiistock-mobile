import {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.wiilog.wiistock',
    appName: 'Follow GT',
    webDir: 'www',
    bundledWebRuntime: false,
    loggingBehavior: 'none',
    plugins: {
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"],
        },
        LocalNotifications: {
        },
        CapacitorSQLite: {
            androidIsEncryption: false,
            androidBiometric: {
                biometricAuth: false,
                biometricTitle: "Biometric login for capacitor sqlite",
                biometricSubTitle: "Log in using your biometric"
            }
        }
    },
};

export default config;
