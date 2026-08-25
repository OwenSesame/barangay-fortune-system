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
        const fullOriginalPath = path.join(process.cwd(), originalFilePath);
        
        // Ensure the file exists
        if (!fs.existsSync(fullOriginalPath)) {
            return originalFilePath;
        }

        // Determine if file is actually an image (Multer allows PDFs too)
        const ext = path.extname(originalFilePath).toLowerCase();
        if (ext === '.pdf') {
            // Can't optimize PDF with sharp, just return the original
            return originalFilePath; 
        }

        // Generate a new optimized filename
        const optimizedFilename = 'opt_' + path.basename(originalFilePath);
        const optimizedRelativePath = path.join('uploads', optimizedFilename);
        const fullOptimizedPath = path.join(process.cwd(), optimizedRelativePath);

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

        // Always use forward slashes for DB consistency
        return optimizedRelativePath.replace(/\\/g, '/');

    } catch (error) {
        console.error("Error processing image with sharp:", error);
        // Fallback to original file if sharp fails
        return originalFilePath.replace(/\\/g, '/');
    }
};
