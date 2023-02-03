const fs = require('fs');
const path = require('path');


const newVersion = process.argv && process.argv.length > 2 ? process.argv[2] : undefined;
if (this.newVersion) {
    throw new Error('New version is a required argument\nUsage: node change-app-version <new version>');
}

const appBuildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(appBuildGradlePath)) {
    throw new Error('File android/app/build.gradle does not exist, please generate the android capacitor app before');
}

const now = new Date();
const month = now.getMonth();
const monthStr = (month < 10 ? '0' : '') + month;
const date = now.getDate();
const dateStr = (date < 10 ? '0' : '') + date;
const newVersionCode = Number(`${now.getFullYear()}${monthStr}${dateStr}`);
const wiilogVersionRegex = /\d+\.\d+(\.\d+)?(#[a-zA-Z0-9\-]+)?/.source;

const appBuildGradleContent = fs.readFileSync(appBuildGradlePath);
const appBuildGradleNewContent = appBuildGradleContent.toString()
    .replace(new RegExp(`versionName \\"${wiilogVersionRegex}\\"`), `versionName "${newVersion}"`)
    .replace(/versionCode \d+/, `versionCode ${newVersionCode}`);

fs.writeFileSync(appBuildGradlePath, appBuildGradleNewContent);
console.log('New version written in android/app/build.gradle!');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath);
const packageJsonNewContent = packageJsonContent.toString()
    .replace(new RegExp(`"version": "${wiilogVersionRegex}"`), `"version": "${newVersion}"`);
fs.writeFileSync(packageJsonPath, packageJsonNewContent);
console.log('New version written in package.json!');
