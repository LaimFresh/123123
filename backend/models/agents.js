const db = require('../db'); // Подключаем соединение с БД

// Получить всех агентов
function getAllAgents() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM agents", [], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении агентов:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получить агента по ID
function getAgentById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM agents WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Ошибка при получении агента:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление нового агента
function addAgent(agent) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO agents 
            (name, surname, position, phone, email, photo_url, experience_years, bio, is_available, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const now = new Date().toISOString();
        db.run(
            insertQuery,
            [
                agent.name,
                agent.surname,
                agent.position,
                agent.phone,
                agent.email,
                agent.photo_url || '/images/default-agent.jpg',
                agent.experience_years || 0,
                agent.bio || '',
                agent.is_available ?? 1,
                now
            ],
            function (err) {
                if (err) {
                    console.error('Ошибка при добавлении агента:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленного агента
                }
            }
        );
    });
}

// Обновление агента по ID
function updateAgent(id, agent) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE agents SET
            name = ?, surname = ?, position = ?, phone = ?, email = ?, 
            photo_url = ?, experience_years = ?, bio = ?, is_available = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                agent.name,
                agent.surname,
                agent.position,
                agent.phone,
                agent.email,
                agent.photo_url,
                agent.experience_years,
                agent.bio,
                agent.is_available,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Ошибка при обновлении агента:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление агента по ID
function deleteAgent(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM agents WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Ошибка при удалении агента:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // true, если запись была удалена
            }
        });
    });
}

// Экспорт функций
module.exports = {
    getAllAgents,
    getAgentById,
    addAgent,
    updateAgent,
    deleteAgent
};