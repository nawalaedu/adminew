STEP 1
Buat project Google Apps Script standalone.
Paste Code.gs.

STEP 2
Ganti CONFIG.API_KEY di Code.gs dengan key acak milik Anda.
Contoh: ADMIN-2026-RAHASIA-9X7K2

STEP 3
Deploy > New deployment > Web app.
Execute as: Me.
Who has access: Anyone.
Copy URL /exec.

STEP 4
Buka api.js.
Ganti:
GAS_API_URL = URL /exec Apps Script
GAS_API_KEY = sama persis dengan CONFIG.API_KEY

STEP 5
Upload semua HTML + api.js ke repository GitHub Pages.
Jangan upload Code.gs ke public repository jika Anda tidak ingin kode server terlihat.

Catatan:
HTML asli menggunakan google.script.run. api.js membuat compatibility layer sehingga HTML tidak perlu dibongkar satu per satu.
Method generic simpanOrder/simpanAuthor/ambilDetailOrder otomatis diarahkan berdasarkan nama halaman.

SHEET YANG DIGUNAKAN
BUKU:
ORDER BUKU
AUTHOR BUKU
INVOICE BUKU
ISBN
HKI
HASIL BUKU

ARTIKEL:
ORDER ARTIKEL
AUTHOR ARTIKEL
INVOICE ARTIKEL
HASIL ARTIKEL

OLAH DATA:
ORDER DATA
INVOICE DATA
HASIL DATA

IJP:
ORDER IJP
AUTHOR IJP
INVOICE IJP
HASIL IJP

Sheet yang belum ada akan dibuat otomatis oleh Code.gs.
