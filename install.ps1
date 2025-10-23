Write-Host "Proxy Configurator Installation Script" -ForegroundColor Green
Write-Host "-------------------------------------"

# Download URL
$ZipUrl = "https://github.com/giromo/proxy-configurator-chrome-extension/raw/main/proxy-configurator-chrome-extension.zip"
$ZipFile = "proxy-configurator-chrome-extension.zip"
$Folder = "proxy-configurator-chrome-extension"

Write-Host "Downloading extension..."
Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile

if (-not $?) {
    Write-Host "Error: Failed to download the extension." -ForegroundColor Red
    exit 1
}

Write-Host "Extracting files..."
Expand-Archive -Path $ZipFile -DestinationPath $Folder -Force

if (-not $?) {
    Write-Host "Error: Failed to extract the extension." -ForegroundColor Red
    exit 1
}

Write-Host "-------------------------------------"
Write-Host "Installation Instructions:"
Write-Host "1. Open Chrome and go to chrome://extensions/"
Write-Host "2. Enable 'Developer mode' (top-right toggle)"
Write-Host "3. Click 'Load unpacked' and select the '$Folder' folder"
Write-Host "4. The extension will appear in your Chrome toolbar"
Write-Host "-------------------------------------"
Write-Host "You can now delete the ZIP file and folder if desired."
