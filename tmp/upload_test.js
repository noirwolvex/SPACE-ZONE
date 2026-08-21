import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'tmp', 'dummy.pdf');
const data = await fs.promises.readFile(filePath);

const fd = new FormData();
fd.append('file', new Blob([data], { type: 'application/pdf' }), 'dummy.pdf');

const res = await fetch('http://localhost:3000/api/admin/books/upload', {
    method: 'POST',
    headers: {
        'x-admin-username': 'admin',
        'x-admin-password': 'admin',
    },
    body: fd,
});

const text = await res.text();
console.log(text);