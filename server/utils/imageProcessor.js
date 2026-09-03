import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Optimizes an uploaded image using Sharp.
 * @param {string} originalFilePath - The relative path (e.g. "uploads/req_123.jpg") to the raw uploaded file
 * @returns {Promise<string>} - Returns the relative path to the newly optimized image, or the original path if processing fails
 */
export const processIDPhoto = async (originalFilePath) => {
    try {
        if (!originalFilePath) return null;

        let fullOriginalPath = path.resolve(originalFilePath);
        if (!fs.existsSync(fullOriginalPath)) {
            const inServerPath = path.resolve(process.cwd(), 'server', originalFilePath);
            if (fs.existsSync(inServerPath)) {
                fullOriginalPath = inServerPath;
            } else {
                return originalFilePath.replace(/\\/g, '/');
            }
        }

        // Determine if file is actually an image (Multer allows PDFs too)
        const ext = path.extname(fullOriginalPath).toLowerCase();
        if (ext === '.pdf') {
            // Can't optimize PDF with sharp, just return the original relative path
            const rel = path.relative(process.cwd(), fullOriginalPath).replace(/\\/g, '/');
            return rel.startsWith('server/') ? rel.replace(/^server\//, '') : rel;
        }

        // Generate a new optimized filename in the same directory as the original file
        const uploadsDir = path.dirname(fullOriginalPath);
        const optimizedFilename = 'opt_' + path.basename(fullOriginalPath);
        const fullOptimizedPath = path.join(uploadsDir, optimizedFilename);

        // Process with sharp
        await sharp(fullOriginalPath)
            .rotate() // Automatically rotate based on EXIF data (fixes phone photos)
            .resize(800, null, { // Resize to max 800px width, auto height
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: 75, progressive: true }) // Compress aggressively but retain readability
            .toFile(fullOptimizedPath);

        // Garbage collection: Delete the raw, massive original file to save disk space
        fs.unlink(fullOriginalPath, (err) => {
            if (err) console.error("Failed to delete original raw file:", err);
        });

        // Always return 'uploads/opt_...' for DB consistency
        return ('uploads/' + optimizedFilename).replace(/\\/g, '/');

    } catch (error) {
        console.error("Error processing image with sharp:", error);
        // Fallback to original file if sharp fails
        return originalFilePath.replace(/\\/g, '/');
    }
};
