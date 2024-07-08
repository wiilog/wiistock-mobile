# Wiistock mobile app

## Clone
```sh
git clone git@github.com:wiilog/wiistock-mobile.git
```
## Keystore
* Copier le fichier `android/app/keystore.properties.dist` -> `android/app/keystore.properties`
* Modifier les deux mots de passe du fichier keystore.properties par la valeur contenue dans : `DEV // APK mobile keystore password` ***(trouvable dans notre gestionnaire de mot de passe)***
* Décrypter le fichier `android/app/keystore.jks.asc` avec la commande ***(KEYSTORE_JKS_PASSPHRASE est trouvable dans notre gestionnaire de mot de passe)***
```sh
touch android/app/keystore.jks && gpg -d --passphrase KEYSTORE_JKS_PASSPHRASE --batch android/app/keystore.jks.asc > android/app/keystore.jks
```

* Décrypter le fichier `android/app/google-services.json.asc` avec la commande  ***(GOOGLE_SERVICES_JSON_PASSPHRASE est trouvable dans notre gestionnaire de mot de passe)***
```sh
touch android/app/google-services.json && gpg -d --passphrase GOOGLE_SERVICES_JSON_PASSPHRASE --batch android/app/google-services.json.asc > android/app/google-services.json
```

## Connexion auto en mode dev
* Copier le fichier `src/environments/credential.ts.dist` -> `src/environments/credential.ts`, il sert en mode dev une connexion automatique

# Lancement
La commande suivante permet de lancer l'application sur un émulateur ou un device connecté
```sh
yarn watch
```

# Build
La commande suivante permet de build l'application en mode dev
```sh
yarn gradle:assemble:debug
```

La commande suivante permet de build l'application en mode prod
```sh
gradle:assemble
```
