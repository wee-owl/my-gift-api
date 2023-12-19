import express from 'express';
import fs from 'node:fs/promises';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
const port = 3000;
const filePath = './gifts.json';

app.use(cors());

// Парсер для JSON-данных
app.use(express.json());

// Встроенный парсер для данных формы
app.use(express.urlencoded({ extended: true }));

const generateUniqueId = (length = 10) =>
  crypto.randomBytes(length).toString('hex').slice(0, length);

// Асинхронная функция для сохранения данных
const saveData = async data => {
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData);
};

// Асинхронная функция для загрузки данных
const loadData = async () => {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveData({});
      return {};
    } else {
      throw error;
    }
  }
};

// Обработка POST-запроса
app.post('/api/gift', async (req, res, next) => {
  try {
    console.log(req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({ message: 'Тело запроса отсутствует' });
    }

    const id = generateUniqueId();
    const gifts = await loadData();
    gifts[id] = req.body;

    await saveData(gifts);
    res.send({ message: 'Подарок успешно зарегистрирован', id });
  } catch (error) {
    next(error); // Передаем ошибку следующему обработчику
  }
});

// Обработка GET-запроса
app.get('/api/gift/:id', async (req, res, next) => {
  try {
    const gifts = await loadData();
    const gift = gifts[req.params.id];

    if (gift) {
      res.send(gift);
    } else {
      res.status(404).send({ message: 'Подарок не найден' });
    }
  } catch (error) {
    next(error); // Передаем ошибку следующему обработчику
  }
});

app.use((req, res, next) => {
  res.status(404).send({ message: 'Маршрут не найден' });
});

// Промежуточное ПО для обработки ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Что-то сломалось!');
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
