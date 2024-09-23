const bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const {nama, password} = req.body;
    const hash = process.env.AVATAR_AI_PASSWORD
    if (!password || !hash) {
        console.error('Terjadi kesalahan: Data password atau hash tidak tersedia');
        return res.status(400).json({ pesan: 'Data password atau hash tidak tersedia' });
    }

    try {
        const result = await bcrypt.compare(password, hash);
        if (result) {
            const payload = {
                id : 1, 
                userName : nama
            }
            const secret = process.env.AVATAR_AI_SECREET
            const token = jwt.sign(payload, secret)
            console.log('login berhasil')
            return res.status(200).json({ pesan: 'Login berhasil', token : token});
        } else {
            console.log('Password salah');
            return res.status(401).json({ pesan: 'Password salah' });
        }
    } catch (err) {
        console.error('Terjadi kesalahan:', err);
        return res.status(500).json({ pesan: 'Terjadi kesalahan saat memverifikasi password' });
    }
}

const accessValidation = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ pesan: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authorization.split(' ')[1];
    const secret = process.env.AVATAR_AI_SECREET;

    try {
        const jwtDecode = jwt.verify(token, secret);
        req.user = jwtDecode;
        next();
    } catch (err) {
        console.error('Terjadi kesalahan saat memverifikasi token:', err);
        if (err instanceof jwt.JsonWebTokenError && err.message === 'jwt malformed') {
            return res.status(400).json({ pesan: 'Format token tidak valid.' });
        }
        return res.status(403).json({ pesan: 'Token tidak valid atau kadaluarsa.' });
    }
};

module.exports = {
    login,
    accessValidation
}