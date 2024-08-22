const gulp = require('gulp');
const rename = require('gulp-rename');
const fontmin = require('gulp-fontmin');
const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');
const svgson = require('svgson');

// Function to validate a font file
function isFontValid(filePath) {
  return new Promise((resolve) => {
    try {
      const font = fontkit.openSync(filePath);
      resolve(true); // Font is valid
    } catch (error) {
      resolve(false); // Font is not valid
    }
  });
}

// Function to validate SVG file
function isSvgValid(filePath) {
  return new Promise((resolve) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading SVG file ${filePath}: ${err.message}`);
        resolve(false);
      } else {
        svgson(data)
          .then(() => resolve(true))
          .catch((err) => {
            console.error(`SVG file ${filePath} is not valid: ${err.message}`);
            resolve(false);
          });
      }
    });
  });
}

// Convert fonts to multiple formats
async function convertFonts(done) {
  const srcPath = 'src/fonts'; // Source folder containing the font families
  const destPath = 'dist/fonts'; // Destination folder

  const fontFormats = ['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

  // Iterate through each font family folder
  fs.readdirSync(srcPath).forEach(async (familyFolder) => {
    const familyPath = path.join(srcPath, familyFolder);

    // Check if it's a directory
    if (fs.statSync(familyPath).isDirectory()) {

      // Iterate through each style (e.g., regular, bold, light)
      fs.readdirSync(familyPath).forEach(async (styleFile) => {
        const stylePath = path.join(familyPath, styleFile);
        const styleName = path.basename(styleFile, path.extname(styleFile)).toLowerCase();

        // Validate the font
        const isValid = await isFontValid(stylePath);

        if (styleFile.endsWith('.svg')) {
          const isSvg = await isSvgValid(stylePath);
          if (!isSvg) {
            console.error(`SVG file ${styleFile} is not valid.`);
            return;
          }
        }

        if (isValid) {
          // Create destination folder for the style
          const styleDestPath = path.join(destPath, familyFolder, styleName);
          if (!fs.existsSync(styleDestPath)) {
            fs.mkdirSync(styleDestPath, { recursive: true });
          }

          // Convert and copy the font to the appropriate style folder
          fontFormats.forEach((format) => {
            gulp.src(stylePath)
              .pipe(fontmin({ formats: [format] }))
              .pipe(rename({ extname: `.${format}` }))
              .pipe(gulp.dest(styleDestPath));
          });
        } else {
          console.error(`Font ${styleFile} is not valid.`);
        }
      });
    }
  });

  done();
}

// Export the task
exports.convert = convertFonts;
