import { type Request, type Response } from 'express'
import { StorageService } from '../services/storage.js'

export class StorageController {
    private readonly storageService = new StorageService()

    public async upload(req: Request, res: Response) {
        try {
            const file = req.file

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' })
            }

             const uploadedFile = await this.storageService.upload(file)

            res.status(200).json(uploadedFile)
        } catch (error) {
            res.status(500).json({ error: 'Failed to upload file' })
        }
    }
}