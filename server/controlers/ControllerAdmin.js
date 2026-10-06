const { issueToken, isValidToken } = require('../middleware/auth');

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '111';

class Admin {
  // POST /admin/login
  static async postAdmin(req, res) {
    try {
      const { login, password } = req.body || {};

      if (!login || !password) {
        return res.status(400).json({
          success: false,
          message: 'Логин и пароль обязательны',
        });
      }

      if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Неверный логин или пароль',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Успешный вход',
        data: {
          token: issueToken(login),
          login,
        },
      });
    } catch (error) {
      console.error('Ошибка в postAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера: ' + error.message,
      });
    }
  }

  // GET /admin/me — проверка сохранённого токена
  static async getAdmin(req, res) {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : header;

      if (!isValidToken(token)) {
        return res.status(401).json({ success: false, message: 'Сессия недействительна' });
      }

      return res.status(200).json({ success: true, data: { login: ADMIN_LOGIN } });
    } catch (error) {
      console.error('Ошибка в getAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера: ' + error.message,
      });
    }
  }
}

module.exports = Admin;
