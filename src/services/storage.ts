import 'dotenv/config'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto'

export class StorageService {
    private readonly client: S3Client
    private readonly bucket: string

    public constructor() {
        this.client = new S3Client({
            endpoint: process.env.S3_SELECTEL_ENDPOINT!,
            credentials: {
                accessKeyId: process.env.S3_SELECTEL_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SELECTEL_SECRET_ACCESS_KEY!
            },
            region: process.env.S3_SELECTEL_REGION!
        })

        this.bucket = process.env.S3_SELECTEL_BUCKET_NAME!
    }

    public async upload(file: Express.Multer.File) {

        const extension = extname(file.originalname)
        const fileName = `uploads/${randomUUID()}${extension}`

        const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: fileName,
                Body: file.buffer,
            })

        try {
            return await this.client.send(command)
        } catch (error) {
            console.error('Error uploading file to S3:', error)
            throw new Error('Failed to upload file')
        }
    }
}