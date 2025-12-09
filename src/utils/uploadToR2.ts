import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../config/r2';
import { randomBytes } from 'crypto';
import path from 'path';

export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export const uploadToR2 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  const fileExtension = path.extname(file.originalname);
  const filename = `${folder}/${randomBytes(16).toString('hex')}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  return {
    filename,
    url: `${R2_PUBLIC_URL}/${filename}`,
    size: file.size,
    mimeType: file.mimetype,
  };
};

export const deleteFromR2 = async (filename: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filename,
  });

  await r2Client.send(command);
};