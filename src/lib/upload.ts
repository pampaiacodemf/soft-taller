import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

type UploadResult = {
    url: string;
    filename: string;
};

/**
 * Upload a file to local storage (/public/uploads)
 * In production, swap this implementation with an S3 upload.
 */
export async function uploadFile(
    base64Data: string,
    mimeType: string,
    folder = "photos"
): Promise<UploadResult> {
    const ext = mimeType.split("/")[1] ?? "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const uploadFolder = path.join(process.cwd(), "public", UPLOAD_DIR, folder);

    await mkdir(uploadFolder, { recursive: true });

    const buffer = Buffer.from(
        base64Data.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
    );

    const filePath = path.join(uploadFolder, filename);
    await writeFile(filePath, buffer);

    return {
        url: `/${UPLOAD_DIR}/${folder}/${filename}`,
        filename,
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
