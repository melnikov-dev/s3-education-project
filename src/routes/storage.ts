import { Router } from 'express'
import multer from 'multer'
import { StorageController } from '../controllers/storage.js'

const router = Router()
const upload = multer()

const controller = new StorageController()

router.post('/', upload.single('file'), async (req, res) => {
    await controller.upload(req, res)
})

export default router;