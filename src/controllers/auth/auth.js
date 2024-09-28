const bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
const { getUser, createUser, updatePassword } = require('../../models/db_aiModel')

// Fungsi Login
const login = async (req, res) => {
    const { nama, password } = req.body;
    console.log(req.body)

    if (!nama || !password) {
        console.error('Masukan username dan password dengan benar.');
        return res.status(400).json({ pesan: 'Masukan username dan password dengan benar.' });
    }

    try {
        const user = await getUser(nama);

        if (user.length === 0) {
            return res.status(404).json({ pesan: 'User tidak ditemukan' });
        }

        const hash = user[0].password;
        const result = await bcrypt.compare(password, hash);
        if (result) {
            const payload = {
                id: user[0].id, 
                userName: user[0].username
            };
            const secret = 'A330214'
            const token = jwt.sign(payload, secret, { expiresIn: '4h' }); // Token JWT dengan durasi 1 jam
            console.log('Login berhasil');
            return res.status(200).json({ pesan: 'Login berhasil', token: token });
        } else {
            console.log('Password salah');
            return res.status(401).json({ pesan: 'Password salah' });
        }
    } catch (err) {
        console.error('Terjadi kesalahan:', err);
        return res.status(500).json({ pesan: 'Terjadi kesalahan saat memverifikasi password' });
    }
};
const registers = async (req, res) => {
    const { nama, password } = req.body;

    if (!nama || !password) {
        console.error('Silahkan masukan nama dan password dengan benar');
        return res.status(400).json({ pesan: 'Silahkan masukan nama dan password dengan benar' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Gunakan model createUser untuk membuat user baru di database
        const result = await createUser(nama, hashedPassword);

        if (result.success) {
            console.log('User berhasil didaftarkan');
            return res.status(201).json({ pesan: 'User berhasil didaftarkan' });
        } else if (result.pesan === 'Username already exists') {
            console.error('Username sudah digunakan');
            return res.status(400).json({ pesan: 'Username sudah digunakan' });
        } else {
            return res.status(400).json({ pesan: 'Gagal mendaftarkan user' });
        }
    } catch (err) {
        console.error('Terjadi kesalahan:', err);
        return res.status(500).json({ pesan: 'Terjadi kesalahan saat registrasi user' });
    }
};

const updateUsers = async (req, res) => {
    const { nama, password } = req.body;
    console.log(req.body)
    if ( !password) {
        console.error('Silahkan masukan password baru');
        return res.status(400).json({ pesan: 'Silahkan masukan password baru' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await updatePassword(nama, hashedPassword);
        console.log(result)
        if (result.success) {
            console.log('Password berhasil di update');
            return res.status(201).json({ pesan: 'Password berhasil di update' });
        } else {
            return res.status(400).json({ pesan: 'Gagal update password' });
        }
    } catch (err) {
        console.error('Terjadi kesalahan:', err);
        return res.status(500).json({ pesan: 'Terjadi kesalahan saat update user' });
    }
};

const accessValidation = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ pesan: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authorization.split(' ')[1];
    const secret = 'A330214'

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
    registers,
    updateUsers,
    accessValidation
}