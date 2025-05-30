const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const path = require('path'); // Добавляем path
const bcrypt = require('bcryptjs');
const session = require('express-session');
faker.locale = 'ru'; // Установка локали на русский язык

// Загрузка переменных окружения
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: 'Q1qqqqqq', // Секретный ключ для подписи сессий
    resave: false,            // Не сохранять сессию при каждом запросе
    saveUninitialized: true,  // Сохранять неинициализированные сессии
    cookie: { secure: false } // Установите `true`, если используете HTTPS
}));

// Подключение статических файлов Vue.js
const publicPath = path.join(__dirname, 'public'); // Путь к папке public
app.use(express.static(publicPath));
// Подключение к MySQL
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'bydxdw0ubavive0jxvde-mysql.services.clever-cloud.com', // Host из Railway
    user: process.env.MYSQL_USER || 'u9q6qotu5eoiaazk',     // User из Railway
    password: process.env.MYSQL_PASSWORD || 'rk8chGBlnOPxHx8EMQka', // Password из Railway
    database: process.env.MYSQL_DATABASE || 'bydxdw0ubavive0jxvde', // Database из Railway
    port: process.env.MYSQL_PORT || 3306,       // Port из Railway
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Проверка подключения при старте
pool.getConnection()
    .then(conn => {
        console.log('✅ Успешное подключение к MySQL!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к MySQL:', err.message);
    });

// Инициализация базы данных
async function initializeDatabase() {
    try {
        // Создание таблицы medical_goods
         await pool.query(`
            CREATE TABLE IF NOT EXISTS flats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(18, 2) NOT NULL,
                area DECIMAL(10, 2),
                rooms INT,
                floor INT,
                total_floors INT,
                address VARCHAR(255) NOT NULL,
                image_url VARCHAR(255),
                is_available BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица: agents — сотрудники агентства недвижимости
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                surname VARCHAR(255) NOT NULL,
                position VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(255),
                photo_url VARCHAR(255),
                experience_years INT DEFAULT 0,
                bio TEXT,
                is_available BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
              // Создание таблицы users с полем role
              await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
                )
            `);
    
            // Проверка существования администратора
            const adminEmail = 'admin';
            const adminPassword = 'Q1!qqqqqq';
    
            const [existingAdmin] = await pool.query('SELECT * FROM users WHERE username = ?', [adminEmail]);
            if (existingAdmin.length === 0) {
                // Хешируем пароль
                const hashedPassword = await bcrypt.hash(adminPassword, 8);
    
                // Создаем администратора с ролью admin
                await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
                console.log('Администратор создан: admin');
            } else {
                console.log('Администратор уже существует: admin');
            }
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
}

// Функция для заполнения таблицы medical_goods
async function seedFlats() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM flats');
        if (countRows[0].count > 0) {
            console.log('Таблица flats уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const flats = [];
        for (let i = 1; i <= 100; i++) {
            flats.push([
                faker.lorem.words(3), // Заголовок
                faker.lorem.sentence(10), // Описание
                parseFloat(faker.commerce.price({ min: 1_000_000, max: 10_000_000 })), // Цена
                parseFloat(faker.string.numeric(2)), // Площадь
                faker.helpers.arrayElement([1, 2, 3, 4, 5]), // Число комнат
                faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]), // Этаж
                faker.helpers.arrayElement([5, 9, 12, 16, 20, 24]), // Всего этажей
                faker.location.streetAddress(), // Адрес
                `flat${i}.jpg`, // URL изображения
                faker.datatype.boolean(), // Доступна ли
            ]);
        }

        const query = `
            INSERT INTO flats 
            (title, description, price, area, rooms, floor, total_floors, address, image_url, is_available)
            VALUES ?
        `;
        await pool.query(query, [flats]);
        console.log('Таблица flats успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы flats:', error.message);
        throw error;
    }
}
async function seedAgents() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM agents');
        if (countRows[0].count > 0) {
            console.log('Таблица agents уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const agents = [];
        for (let i = 1; i <= 100; i++) {
            // Генерация телефона без faker.phone.phoneNumber()
            const phone = '+7 (' + 
                faker.string.numeric(3) + ') ' + 
                faker.string.numeric(3) + '-' + 
                faker.string.numeric(2) + '-' + 
                faker.string.numeric(2);

            agents.push([
                faker.person.firstName(), // Имя
                faker.person.lastName(), // Фамилия
                faker.helpers.arrayElement(['Агент по продажам', 'Руководитель отдела', 'Юрист', 'Консультант']), // Должность
                phone, // Телефон
                faker.internet.email(), // Email
                `agent${i}.jpg`, // URL фото
                faker.helpers.arrayElement([1, 2, 3, 5, 7, 10, 15]), // Опыт работы
                faker.lorem.paragraph(), // Биография
                faker.datatype.boolean(), // Доступен ли
            ]);
        }

        const query = `
            INSERT INTO agents 
            (name, surname, position, phone, email, photo_url, experience_years, bio, is_available)
            VALUES ?
        `;
        await pool.query(query, [agents]);
        console.log('Таблица agents успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы agents:', error.message);
        throw error;
    }
}
// Функция для запуска сидера
async function runSeeder() {
    try {
        await seedFlats();
        await seedAgents();
        console.log('Сидер завершил работу.');
    } catch (error) {
        console.error('Ошибка при выполнении сидера:', error.message);
    }
}

// Вызов функции
runSeeder();
// Маршрут для регистрации
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Проверяем, существует ли пользователь с таким именем
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 8);

        // Сохраняем пользователя в базе данных
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Маршрут для входа
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Находим пользователя по имени
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
        }

        // Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
        }

        // Устанавливаем сессию
        req.session.userId = user.id;
        req.session.username = user.username; // Сохраняем имя пользователя
        req.session.role = user.role; // Сохраняем роль пользователя

        res.json({
            message: 'Вход выполнен успешно',
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('Ошибка при входе:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Маршрут для выхода
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при выходе' });
        }
        res.json({ message: 'Вы успешно вышли' });
    });
});

// Защищенный маршрут
app.get('/protected', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Необходимо войти в систему' });
    }

    res.json({
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
});
// Маршруты API для medical_goods
// Middleware для проверки роли администратора
function isAdmin(req, res, next) {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
}

// Получить список квартир с пагинацией
app.get('/api/flats', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM flats');
        const total = countRows[0].total;

        const [rows] = await pool.query('SELECT * FROM flats LIMIT ? OFFSET ?', [limit, offset]);

        res.json({
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Ошибка при получении квартир:', error.message);
        res.status(500).json({ error: 'Не удалось загрузить квартиры', details: error.message });
    }
});

// Получить квартиру по ID
app.get('/api/flats/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM flats WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Квартира не найдена' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Не удалось получить данные квартиры', details: error.message });
    }
});

// Добавить новую квартиру
app.post('/api/flats', isAdmin, async (req, res) => {
    const { title, description, price, area, rooms, floor, total_floors, address, image_url, is_available } = req.body;

    if (!title || !price || !address) {
        return res.status(400).json({ error: 'Отсутствуют обязательные поля: title, price или address' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Некорректная цена' });
    }

    const parsedIsAvailable = is_available === 'true' || is_available === true || false;

    try {
        const [result] = await pool.query(
            'INSERT INTO flats (title, description, price, area, rooms, floor, total_floors, address, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, parsedPrice, area, rooms, floor, total_floors, address, image_url, parsedIsAvailable]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Ошибка при добавлении квартиры:', error.message);
        res.status(500).json({ error: 'Не удалось добавить квартиру', details: error.message });
    }
});

// Обновить квартиру по ID
app.put('/api/flats/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const updatedFlat = req.body;

    if (!updatedFlat.title || !updatedFlat.price || !updatedFlat.address) {
        return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE flats SET title = ?, description = ?, price = ?, area = ?, rooms = ?, floor = ?, total_floors = ?, address = ?, image_url = ?, is_available = ? WHERE id = ?',
            [
                updatedFlat.title,
                updatedFlat.description,
                updatedFlat.price,
                updatedFlat.area,
                updatedFlat.rooms,
                updatedFlat.floor,
                updatedFlat.total_floors,
                updatedFlat.address,
                updatedFlat.image_url,
                updatedFlat.is_available,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Квартира не найдена' });
        }

        res.json({ message: 'Квартира успешно обновлена' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось обновить квартиру', details: error.message });
    }
});

// Удалить квартиру по ID
app.delete('/api/flats/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM flats WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Квартира не найдена' });
        }
        res.json({ message: 'Квартира успешно удалена' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось удалить квартиру', details: error.message });
    }
});

// Получить список агентов с пагинацией
app.get('/api/agents', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM agents');
        const total = countRows[0].total;

        const [rows] = await pool.query('SELECT * FROM agents LIMIT ? OFFSET ?', [limit, offset]);

        res.json({
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Ошибка при получении агентов:', error.message);
        res.status(500).json({ error: 'Не удалось загрузить агентов', details: error.message });
    }
});

// Получить агента по ID
app.get('/api/agents/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM agents WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Агент не найден' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Не удалось получить данные агента', details: error.message });
    }
});

// Добавить нового агента
app.post('/api/agents', isAdmin, async (req, res) => {
    const { name, surname, position, phone, email, photo_url, experience_years, bio, is_available } = req.body;

    if (!name || !surname || !position) {
        return res.status(400).json({ error: 'Отсутствуют обязательные поля: name, surname или position' });
    }

    const parsedExperienceYears = parseInt(experience_years) || 0;
    const parsedIsAvailable = is_available === 'true' || is_available === true || false;

    try {
        const [result] = await pool.query(
            'INSERT INTO agents (name, surname, position, phone, email, photo_url, experience_years, bio, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, surname, position, phone, email, photo_url, parsedExperienceYears, bio, parsedIsAvailable]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Ошибка при добавлении агента:', error.message);
        res.status(500).json({ error: 'Не удалось добавить агента', details: error.message });
    }
});

// Обновить агента по ID
app.put('/api/agents/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const updatedAgent = req.body;

    if (!updatedAgent.name || !updatedAgent.surname || !updatedAgent.position) {
        return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE agents SET name = ?, surname = ?, position = ?, phone = ?, email = ?, photo_url = ?, experience_years = ?, bio = ?, is_available = ? WHERE id = ?',
            [
                updatedAgent.name,
                updatedAgent.surname,
                updatedAgent.position,
                updatedAgent.phone,
                updatedAgent.email,
                updatedAgent.photo_url,
                updatedAgent.experience_years,
                updatedAgent.bio,
                updatedAgent.is_available,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Агент не найден' });
        }

        res.json({ message: 'Агент успешно обновлён' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось обновить агента', details: error.message });
    }
});

// Удалить агента по ID
app.delete('/api/agents/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM agents WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Агент не найден' });
        }
        res.json({ message: 'Агент успешно удалён' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось удалить агента', details: error.message });
    }
});
// Обработка всех остальных маршрутов для Vue Router
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});
// Запуск сервера
(async () => {
    try {
        await initializeDatabase(); // Инициализируем базу данных
        await runSeeder();         // Запускаем сидер
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            console.log(`Frontend is served on 8080`);

        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
})();
