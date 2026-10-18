import 'dotenv/config'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
        const key = `uploads/${randomUUID()}${extension}`

        const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer, // передаем buffer собранный multer в S3
                ContentType: file.mimetype,
                Metadata: {
                    originalname: file.originalname // имя файла, которое пришло от клиента кладем в метаданные
                }
            })
        try {
            return await this.client.send(command)
        } catch (error) {
            console.error('Error uploading file to S3:', error)
            throw new Error('Failed to upload file')
        }
    }

    public async download(key: string) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        })
        try {
            return await this.client.send(command)
        } catch (error) {
            console.error('Error downloading file from S3:', error)
            throw new Error('Failed to download file')
        }
    }

    public async getAll() {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket
        })
        try {
            return await this.client.send(command)
        } catch (error) {
            console.error('Error requesting objects from S3:', error)
            throw new Error('Failed to requesting objects')
        }
    }

    // вернется 204 от S3 даже если файла с таким key не существовало
    // если нужно явное удаление, то можно делать сначала проверку с помощью HeadObjectCommand
    public async delete(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        })
        try {
            return await this.client.send(command) 
        } catch (error) {
            console.error('Error deletion file from S3:', error)
            throw new Error('Failed to delete file')
        }
    }
}