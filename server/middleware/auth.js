const ADMIN_TOKEN = 'admin-secret-token';

function issueToken(login) {
  return `${Buffer.from(`${login}:${ADMIN_TOKEN}`).toString('base64')}`;
}

function isValidToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return false;
    const login = decoded.slice(0, separatorIndex);
    const secret = decoded.slice(separatorIndex + 1);
    return Boolean(login) && secret === ADMIN_TOKEN;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!isValidToken(token)) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация администратора',
    });
  }

  return next();
}

module.exports = { issueToken, isValidToken, requireAdmin };
