# Wiistock mobile app
## Installation
### Clone
### Keystore
* Copier le fichier `android/app/keystore.properties.dist` -> `android/app/keystore.properties`
* Modifier le fichier créer en les deux valeurs pour les passwords `DEV // APK mobile keystore password`
* Décrypter le fichier `android/app/keystore.jks.asc` avec la commande ***(KEYSTORE_JKS_PASSPHRASE est trouvable dans notre gestionnaire de mot de passe)***
```sh
touch android/app/keystore.jks && gpg -d --passphrase KEYSTORE_JKS_PASSPHRASE --batch android/app/keystore.jks.asc > android/app/keystore.jks
```

* Décrypter le fichier `android/app/google-services.json.asc` avec la commande  ***(GOOGLE_SERVICES_JSON_PASSPHRASE est trouvable dans notre gestionnaire de mot de passe)***
```sh
touch android/app/google-services.json && gpg -d --passphrase GOOGLE_SERVICES_JSON_PASSPHRASE --batch android/app/google-services.json.asc > android/app/google-services.json
```

### Connexion auto en mode dev
* Copier le fichier `src/environments/credential.ts.dist` -> `src/environments/credential.ts`, il sert en mode dev une connexion automatique
