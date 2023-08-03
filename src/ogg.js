import ffmpeg from 'fluent-ffmpeg'
import installer from'@ffmpeg-installer/ffmpeg'
import axios from "axios"
import{createWriteStream} from 'fs'
import {dirname,resolve} from 'path'
import {fileURLToPath} from 'url'
import { removeFile } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url)) // пллучаєм адресу папки в якій ми знаходимось тобто src

class OggConverter
{

constructor()
{
    ffmpeg.setFfmpegPath(installer.path)
}


toMp3(input, output){
    try{
    const outputPuth = resolve(dirname(input), `${output}.mp3`) //Змінна outputPuth: Ви створюєте змінну outputPuth, яка вказує шлях ім'я для вихідного аудіофайлу (mp3) на основі шляху та ім'я вхідного файлу.
    return new Promise((resolve,reject)=>{//новий Promise, в якому виконується асинхронна операція з використанням бібліотеки FFmpeg. 
        ffmpeg(input)  // ffmpeg(input), де input - це вхідний файл, і налаштовуєте параметри для створення вихідного файла. 
        .inputOption('-t 30') //Після закінчення операції ffmpeg викликається відповідний обробник події 
        .output(outputPuth)
        .on('end',()=>{
            removeFile(input) // свій метод import { removeFile } from './utils' видаляємо файл
            resolve(outputPuth)
        }) //on('end'), який повертає resolve(outputPuth), де outputPuth - це шлях ім'я вихідного файла.
        .on('error', (err)=>reject(err.message))
        .run()

    })
    }
    catch(e)
    {
       console.log('Error while creating mp3', e.message ) 
    }
}

async create(url, filename)
{
    try{
        const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)
        const response = await axios(
            {
                method:'get',
                url,
                responseType:'stream'
            }
        )
        return new Promise(resolve=>{
            const stream = createWriteStream(oggPath)  //  Здійснюється виклик функції createWriteStream, яка створює потік запису файлу з шляхом oggPath. Цей потік запису використовується для збереження даних зі змінної response.data.
            response.data.pipe(stream) //Здійснюється пайпінг (перенаправлення) даних, які отримані від response.data (це потік з даними, які повернув сервер після запиту), в потік запису stream. Це означає, що дані, отримані від сервера, будуть записані в файл за шляхом oggPath.
            stream.on('finish',()=>resolve(oggPath)) // Додається подія 'finish' до потоку запису stream. Ця подія виникає, коли запис в потік завершено (файл успішно збережено). В цей момент викликається функція, передана у resolve(), і як аргумент передається oggPath. Таким чином, коли файл успішно збережено, Promise вирішується (resolves) зі значенням oggPath.
        })
       
    }
    catch(e)
    {
        console.log("Error while creating ogg", e.message)
    }
 
 
}



}
export const ogg= new OggConverter()