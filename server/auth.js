import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'smartspend-super-secret-key-change-in-env';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Kiểm tra tính hợp lệ của email (Mở toàn bộ, không giới hạn Allowlist / Blocklist)
 * @param {string} email
 * @returns {{ allowed: boolean, email?: string, reason?: string }}
 */
export function checkEmailAccess(email) {
  if (!email || typeof email !== 'string') {
    return {
      allowed: false,
      reason: 'Địa chỉ email không hợp lệ.',
      code: 'INVALID_EMAIL'
    };
  }

  return {
    allowed: true,
    email: email.trim().toLowerCase()
  };
}

/**
 * Xác thực Google ID Token (Credential) gửi từ Google One Tap / Sign-in Button
 * @param {string} idToken
 * @returns {Promise<{ email: string, name: string, picture: string, email_verified: boolean }>}
 */
export async function verifyGoogleCredential(idToken) {
  if (!idToken) {
    throw new Error('Thiếu token xác thực Google.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId) {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Thông tin người dùng Google không hợp lệ.');
    }
    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
      email_verified: Boolean(payload.email_verified),
    };
  }

  // Trường hợp dự phòng nếu chưa cấu hình GOOGLE_CLIENT_ID trên server (Decode payload)
  const decoded = jwt.decode(idToken);
  if (!decoded || !decoded.email) {
    throw new Error('Không thể giải mã token Google.');
  }
  return {
    email: decoded.email,
    name: decoded.name || decoded.email.split('@')[0],
    picture: decoded.picture || '',
    email_verified: Boolean(decoded.email_verified ?? true),
  };
}

/**
 * Cấp phát JSON Web Token cho phiên đăng nhập người dùng
 * @param {{ email: string, name: string, picture: string }} user
 * @returns {string}
 */
export function generateSessionToken(user) {
  return jwt.sign(
    {
      email: user.email.toLowerCase().trim(),
      name: user.name,
      picture: user.picture || '',
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Phiên đăng nhập dài 30 ngày
  );
}

/**
 * Xác minh tính hợp lệ của Session Token
 * @param {string} token
 * @returns {{ email: string, name: string, picture: string }}
 */
export function verifySessionToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express Middleware bảo vệ các API nội bộ
 * Yêu cầu header: Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = { email: 'dev@localhost', name: 'Developer', picture: '' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Yêu cầu đăng nhập để truy cập tài nguyên này.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifySessionToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      code: 'INVALID_TOKEN'
    });
  }
}
