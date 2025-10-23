#!/bin/bash

echo "Proxy Configurator Installation Script"
echo "-------------------------------------"

# Check if unzip is installed
if ! command -v unzip &> /dev/null; then
    echo "Error: unzip is required. Please install it."
    exit 1
fi

# Download ZIP (replace with your GitHub URL)
ZIP_URL="https://github.com/yourusername/proxy-configurator-chrome-extension/raw/main/proxy-configurator-chrome-extension.zip"
ZIP_FILE="proxy-configurator-chrome-extension.zip"
FOLDER="proxy-configurator-chrome-extension"

echo "Downloading extension..."
curl -L $ZIP_URL -o $ZIP_FILE

if [ $? -ne 0 ]; then
    echo "Error: Failed to download the extension."
    exit 1
fi

echo "Extracting files..."
unzip -o $ZIP_FILE -d $FOLDER

if [ $? -ne 0 ]; then
    echo "Error: Failed to extract the extension."
    exit 1
fi

echo "-------------------------------------"
echo "Installation Instructions:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (top-right toggle)"
echo "3. Click 'Load unpacked' and select the '$FOLDER' folder"
echo "4. The extension will appear in your Chrome toolbar"
echo "-------------------------------------"
echo "You can now delete the ZIP file and folder if desired."
