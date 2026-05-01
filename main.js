const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const registryPath = path.join(__dirname, 'registry.json');

if (!fs.existsSync(registryPath)) {
    fs.writeFileSync(registryPath, JSON.stringify({}));
}

function createWindow() {
    win = new BrowserWindow({
        width: 1500,
        height: 950,
        title: "AetherNet v1.4 - Multi-Tab",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            webSecurity: false 
        }
    });

    win.loadFile('index.html');
}

ipcMain.on('register-site', (event, { domain, folderPath }) => {
    const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    // Clean the path before saving
    let cleanPath = folderPath.replace(/["]+/g, '').trim();
    if (cleanPath.startsWith('file:///')) {
        cleanPath = cleanPath.replace('file:///', '');
    }
    data[domain.toLowerCase().trim()] = decodeURIComponent(cleanPath);
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));
    event.reply('status', `Deployed ${domain}`);
});

ipcMain.on('lookup-domain', (event, input) => {
    const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const cleanInput = input.toLowerCase().trim();

    if (data[cleanInput]) {
        // Ensure the path is decoded and uses the correct slashes
        let rawPath = data[cleanInput].replace(/\\/g, '/');
        if (!rawPath.startsWith('/')) rawPath = '/' + rawPath;
        event.reply('navigate', `file://${rawPath}`);
    } else {
        const isUrl = input.includes('.') && !input.includes(' ');
        const target = isUrl ? (input.startsWith('http') ? input : `https://${input}`) : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        event.reply('navigate', target);
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });