# Set Java and Android SDK environment paths
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\delgr\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host ">>> Preparing web assets in www/..." -ForegroundColor Cyan
npm run build

Write-Host ">>> Syncing with Capacitor Android..." -ForegroundColor Cyan
npx cap sync android

Write-Host ">>> Building Android APK with Gradle..." -ForegroundColor Cyan
Push-Location android
.\gradlew.bat assembleDebug
$gradleResult = $LASTEXITCODE
Pop-Location

if ($gradleResult -ne 0) {
    Write-Host ">>> Gradle build failed with exit code $gradleResult" -ForegroundColor Red
    exit $gradleResult
}

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host ">>> Copying APK to project root..." -ForegroundColor Cyan
    Copy-Item $apkPath -Destination "StudyBot.apk" -Force
    (Get-Item "StudyBot.apk").LastWriteTime = Get-Date
    $fileInfo = Get-Item "StudyBot.apk"
    $sizeMb = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host ">>> SUCCESS: APK ready at StudyBot.apk ($sizeMb MB)" -ForegroundColor Green
} else {
    Write-Host ">>> ERROR: Output APK not found at $apkPath" -ForegroundColor Red
    exit 1
}
