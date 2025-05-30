const db = require('../db'); // Подключаем соединение с БД

// Получить все квартиры
function getAllFlats() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM flats", [], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении квартир:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получить квартиру по ID
function getFlatById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM flats WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Ошибка при получении квартиры:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление новой квартиры
function addFlat(flat) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO flats 
            (title, description, price, area, rooms, floor, total_floors, address, image_url, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                flat.title,
                flat.description,
                flat.price,
                flat.area,
                flat.rooms,
                flat.floor,
                flat.total_floors,
                flat.address,
                flat.image_url,
                flat.is_available ?? 1 // По умолчанию доступна
            ],
            function (err) {
                if (err) {
                    console.error('Ошибка при добавлении квартиры:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление квартиры по ID
function updateFlat(id, flat) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE flats 
            SET title = ?, description = ?, price = ?, area = ?, rooms = ?, 
                floor = ?, total_floors = ?, address = ?, image_url = ?, is_available = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                flat.title,
                flat.description,
                flat.price,
                flat.area,
                flat.rooms,
                flat.floor,
                flat.total_floors,
                flat.address,
                flat.image_url,
                flat.is_available,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Ошибка при обновлении квартиры:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление квартиры по ID
function deleteFlat(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM flats WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Ошибка при удалении квартиры:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // true, если запись была удалена
            }
        });
    });
}

// Экспорт функций для работы с квартирами
module.exports = {
    getAllFlats,
    getFlatById,
    addFlat,
    updateFlat,
    deleteFlat
};