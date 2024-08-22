const fs = require('fs');
const path = require('path');

// Define the root directory
const rootDir = path.join(__dirname, 'font-converter', 'dist', 'fonts');

// Function to move contents up one level and delete the src folder and its contents
function moveAndDeleteSrc(folderPath) {
    const srcFontsPath = path.join(folderPath, 'src', 'fonts');

    if (fs.existsSync(srcFontsPath)) {
        // Get the dynamic folder name inside 'src/fonts'
        const fontSubfolders = fs.readdirSync(srcFontsPath).filter(name =>
            fs.lstatSync(path.join(srcFontsPath, name)).isDirectory()
        );

        if (fontSubfolders.length === 1) {
            const fontName = fontSubfolders[0];
            const fontFolderPath = path.join(srcFontsPath, fontName);

            const files = fs.readdirSync(fontFolderPath);

            files.forEach(file => {
                const oldPath = path.join(fontFolderPath, file);
                const newPath = path.join(folderPath, file);
                fs.renameSync(oldPath, newPath);
            });

            // Remove the now-empty font folder and src/fonts directory
            fs.rmSync(fontFolderPath, { recursive: true, force: true });
            fs.rmSync(srcFontsPath, { recursive: true, force: true });
            fs.rmSync(path.join(folderPath, 'src'), { recursive: true, force: true });
        } else {
            console.log(`Unexpected structure in ${folderPath}. Expected a single folder inside 'src/fonts'.`);
        }
    } else {
        console.log(`src/fonts directory not found in ${folderPath}`);
    }
}

// Read through all directories in the root
fs.readdirSync(rootDir).forEach(folder => {
    const fontFolder = path.join(rootDir, folder);
    if (fs.lstatSync(fontFolder).isDirectory()) {
        // Move files and delete src folder
        fs.readdirSync(fontFolder).forEach(subFolder => {
            const subFolderPath = path.join(fontFolder, subFolder);
            if (fs.lstatSync(subFolderPath).isDirectory()) {
                moveAndDeleteSrc(subFolderPath);
            }
        });
    }
});
