import { type Request, type Response } from 'express'
import { StorageService } from '../services/storage.js'
import { pipeline } from 'stream/promises';

export class StorageController {
    private readonly storageService = new StorageService()

    public async upload(req: Request, res: Response) {
        try {
            const file = req.file // созданный multer объект req.file, где хранится buffer файла
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' })
            }
            // в S3 передается уже buffer целиком, не потоком
            const uploadedFile = await this.storageService.upload(file)
            res.status(200).json(uploadedFile)
        } catch (error) {
            res.status(500).json({ error: 'Failed to upload file' })
        }
    }

    public async createUploadUrl(req: Request, res: Response) {
        try {
            const { fileName, contentType } = req.body as {
                fileName?: unknown
                contentType?: unknown
            }

            // предполагается, что валидация на стороне фронта будет и сюда уже будет приходить правильное имя и content-type
            if (
                typeof fileName !== 'string' || !fileName.trim() ||
                typeof contentType !== 'string' || !contentType.trim()
            ) {
                return res.status(400).json({
                    error: 'fileName and contentType must be non-empty strings',
                })
            }

            const upload = await this.storageService.createUploadUrl(fileName, contentType)
            res.status(200).json(upload)
        } catch (error) {
            res.status(500).json({ error: 'Failed to create upload URL' })
        }
    }

    public async download(req: Request, res: Response) {
        try {
            const { key } = req.query

            if (typeof key !== 'string' || !key) {
                return res.status(400).json({error: 'Invalid or missing key object'})
            }

            const file = await this.storageService.download(key)

            // Определяем Content-Type из файла. Он будет, если мы его в S3 ранее передавали. Если нет, то будет тип для произвольных бинарных данных
            // application/octet-stream - это универсальный MIME-тип для бинарных данных, когда конкретный тип неизвестен.
            // Этот заголовок нужен, чтобы браузер или HTTP-клиент понимал, как интерпритировать содержимое ответа
            res.setHeader('Content-Type', file.ContentType ?? 'application/octet-stream');

            // При загрузке файла в S3 должны были положить originalName в Metadata. Пытаемся достать. Если нет, то используем key
            const filename = file.Metadata?.originalname ?? key
            // Заголовок для определения, что дальше делать с файлом
            res.setHeader('Content-Disposition', `inline; filename=${filename}`); // attachment вместо inline, если надо сразу скачивать

            // Берем данные из S3 (file.Body), которые являются читаемым потоком (as NodeJS.ReadableStream)
            // Методом pipe читает данные из потока по мере их поступления и складывает в response
            await pipeline(file.Body as NodeJS.ReadableStream, res);
        } catch (error) {
            res.status(500).json({ error: 'Failed download file' })
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
             const objects = await this.storageService.getAll()
            res.status(200).json(objects)
        } catch (error) {
            res.status(500).json({ error: 'Failed to requesting objects' })
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const { key } = req.query

            if (typeof key !== 'string' || !key) {
                return res.status(400).json({error: 'Invalid or missing key object'})
            }
            
            await this.storageService.delete(key)
            res.status(200).json({message: 'File deleted successfully'})
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete file' })
        }
    }
}
