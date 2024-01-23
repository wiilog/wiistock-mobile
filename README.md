# Wiistock mobile app
## Installation
### Clone
### Keystore
* Télécharger le fichier keystore.jks dans le répertoire `Outils dev/Compilation apk` sur le sharepoint ici : `android/app/keystore.jks` 
* Copier le fichier `android/app/keystore.properties.dist` -> `android/app/keystore.properties`
* Modifier le fichier créer en mettant les infos trouver sur dashlane `DEV // APK mobile keystore password`
### Google services
* Télécharger le fichier google-services.json dans le répertoire `Outils dev/Compilation apk` sur le sharepoint ici : `android/app/google-services.json` 
### Connexion auto en mode dev
* Copier le fichier `src/environments/credential.ts.dist` -> `src/environments/credential.ts`, il sert en mode dev une connexion automatique
