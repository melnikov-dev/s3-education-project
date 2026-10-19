import 'dotenv/config'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto'

const DIRECT_UPLOAD_URL_EXPIRES_IN_SECONDS = 300

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

    public async createUploadUrl(fileName: string, contentType: string) {
        const extension = extname(fileName)
        const key = `uploads/${randomUUID()}${extension}`
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
            Metadata: {
                originalname: fileName
            }
        })

        try {
            const uploadUrl = await getSignedUrl(this.client, command, {
                expiresIn: DIRECT_UPLOAD_URL_EXPIRES_IN_SECONDS,
                // Включаем Content-Type в подпись, чтобы клиент при загрузке
                // передал тот же MIME-тип, который был указан при создании URL.
                signableHeaders: new Set(['content-type']),
                // Оставляем метаданные оригинального имени файла отдельным
                // HTTP-заголовком x-amz-meta-originalname при загрузке в S3.
                // Данные будут лежать в Metadata.originalname и мы на них смотрим в download методе
                unhoistableHeaders: new Set(['x-amz-meta-originalname']),
            })

            return {
                key,
                uploadUrl,
                expiresIn: DIRECT_UPLOAD_URL_EXPIRES_IN_SECONDS,
            }
        } catch (error) {
            console.error('Error creating upload URL for S3:', error)
            throw new Error('Failed to create upload URL')
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
