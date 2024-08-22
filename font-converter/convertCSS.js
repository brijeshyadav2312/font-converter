const fs = require('fs');
const path = require('path');

// Define the base directories
const baseDir = 'font-converter/dist/fonts';
const outputDir = 'generated-css';

// Supported font formats
const fontFormats = {
    eot: 'embedded-opentype',
    otf: 'opentype',
    svg: 'svg',
    ttf: 'truetype',
    woff: 'woff',
    woff2: 'woff2'
};

// Function to map directory names to font weights
const fontWeights = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 600,
    extrabold: 800,
    heavy: 800,
    black: 900,
    ultrablack: 900
};

// Function to determine font weight from directory name
function getFontWeight(styleDir) {
    const lowerCaseDir = styleDir.toLowerCase();
    for (const [key, weight] of Object.entries(fontWeights)) {
        if (lowerCaseDir.includes(key)) {
            return weight;
        }
    }
    return 400; // Default weight if none of the keywords match
}

// Function to generate @font-face rules
function generateFontFace(fontName, styleDir, files) {
    const weight = getFontWeight(styleDir);
    const src = files.map(file => {
        const ext = path.extname(file).slice(1).toLowerCase();
        const format = fontFormats[ext];
        if (format) {
            const url = `../fonts/${fontName.toLowerCase()}/${styleDir.toLowerCase()}/${file}`;
            return `url("${url}") format('${format}')`;
        }
        return '';
    }).filter(Boolean).join(',\n    ');

    return `
@font-face {
    font-family: "${fontName}";
    font-weight: ${weight};
    src: ${src};
    font-display: swap;
    font-style: normal;
}
`;
}

// Ensure the output directory exists
function ensureOutputDir() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
}

// Function to process each font directory
function processFontDir(fontDir) {
    const fontName = path.basename(fontDir);
    const cssFileName = `${fontName.toLowerCase()}.css`;
    const cssFilePath = path.join(outputDir, cssFileName);
    let cssContent = '';

    console.log(`Processing directory: ${fontDir}`);

    fs.readdir(fontDir, (err, styleDirs) => {
        if (err) {
            console.error(`Failed to read directory: ${fontDir}`, err);
            return;
        }

        styleDirs.forEach(styleDir => {
            const stylePath = path.join(fontDir, styleDir);
            fs.stat(stylePath, (err, stats) => {
                if (err) {
                    console.error(`Failed to stat directory: ${stylePath}`, err);
                    return;
                }

                if (stats.isDirectory()) {
                    console.log(`Processing style directory: ${stylePath}`);

                    fs.readdir(stylePath, (err, files) => {
                        if (err) {
                            console.error(`Failed to read style directory: ${stylePath}`, err);
                            return;
                        }

                        const validFiles = files.filter(file => fontFormats[path.extname(file).slice(1).toLowerCase()]);
                        if (validFiles.length > 0) {
                            cssContent += generateFontFace(fontName, styleDir, validFiles);
                        }

                        if (cssContent) {
                            fs.writeFile(cssFilePath, cssContent.trim(), err => {
                                if (err) {
                                    console.error(`Failed to write CSS file: ${cssFilePath}`, err);
                                } else {
                                    console.log(`Generated CSS file for ${fontName}: ${cssFilePath}`);
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

// Create the output directory
ensureOutputDir();

// Process each font directory in the base directory
fs.readdir(baseDir, (err, fontDirs) => {
    if (err) {
        console.error(`Failed to read base directory: ${baseDir}`, err);
        return;
    }

    console.log(`Found font directories: ${fontDirs.join(', ')}`);

    fontDirs.forEach(fontDir => {
        const fontPath = path.join(baseDir, fontDir);
        fs.stat(fontPath, (err, stats) => {
            if (err) {
                console.error(`Failed to stat directory: ${fontPath}`, err);
                return;
            }

            if (stats.isDirectory()) {
                processFontDir(fontPath);
            } else {
                console.log(`Skipping non-directory: ${fontPath}`);
            }
        });
    });
});

console.log('Processing started...');
