import { Router } from 'express'
import multer from 'multer'
import { StorageController } from '../controllers/storage.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(), // хранение в оперативной памяти сервера, по умолчанию
  limits: {
    fileSize: 100 * 1024 * 1024, // Ограничиваем размер файла, загружаемый на сервер 100 MiB
    files: 1,
  },
})

const controller = new StorageController()

// Подключение multer к потоку запроса, разбор multipart/form-data, собирает файл из поля file
// собирает по чанкам и объединяет в buffer, когда файл полностью получен
// Создает объект в req.file и дальше buffer в S3 передает
router.post('/', upload.single('file'), async (req, res) => {
    await controller.upload(req, res)
})

// 
router.get('/download', async (req, res) => {
    await controller.download(req, res)
})


router.get('/', async (req, res) => {
    await controller.getAll(req, res)
})

router.delete('/', async (req, res) => {
    await controller.delete(req, res)
})

export default router;