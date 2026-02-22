import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

type UploadResult = {
    url: string;
    filename: string;
};

/**
 * Upload a file as a Base64 Data URI
 * This bypasses the Netlify Serverless read-only filesystem restrictions
 * by storing the image directly in the database as a string.
 */
export async function uploadFile(
    base64Data: string,
    mimeType: string,
    folder = "photos"
): Promise<UploadResult> {
    // Ensure the base64 string has the correct Data URI prefix
    const isDataUri = base64Data.startsWith("data:");
    const url = isDataUri ? base64Data : `data:${mimeType};base64,${base64Data}`;

    return {
        url,
        filename: `base64-${Date.now()}`,
    };
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(
    files: { base64Data: string; mimeType: string }[],
    folder = "photos"
): Promise<UploadResult[]> {
    return Promise.all(
        files.map((f) => uploadFile(f.base64Data, f.mimeType, folder))
    );
}
