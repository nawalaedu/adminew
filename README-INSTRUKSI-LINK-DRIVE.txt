PERBAIKAN LINK DRIVE - BUKU, ARTIKEL, IJP

1. File yang sudah diperbaiki:
   - Code.gs
   - api.js
   - orderbuku.html
   - orderartikel.html
   - orderijp.html

2. LOGIKA LINK DRIVE:
   BUKU:
   - Link Drive tampil jika Jenis Penulisan = Naskah Mandiri.
   - Backend menyimpan link hanya untuk Mandiri/Naskah Mandiri.
   - Jika bukan Mandiri, link disimpan kosong.

   ARTIKEL:
   - Link Drive tampil jika KMT = M.
   - Backend menyimpan link hanya jika KMT = M.
   - Jika bukan M, backend menyimpan '-'.

   IJP:
   - Link Drive tampil jika KMT = M.
   - Backend menyimpan link hanya jika KMT = M.
   - Jika bukan M, backend menyimpan '-'.

3. KONEKSI GITHUB PAGES -> GAS:
   api.js mempertahankan google.script.run yang digunakan HTML lama.
   Transport tetap JSONP GET sehingga tidak bergantung pada CORS POST.
   API URL dan API key disamakan dengan konfigurasi project lama.

4. DEPLOY GOOGLE APPS SCRIPT:
   - Buka Apps Script.
   - Ganti Code.gs dengan Code.gs pada ZIP ini.
   - Simpan.
   - Deploy > Manage deployments.
   - Edit deployment Web app.
   - Execute as: Me.
   - Who has access: Anyone.
   - Deploy / New version.
   - Pastikan URL Web App tetap sama dengan GAS_API_URL di api.js.

5. DATA LAMA:
   - Tidak ada setupDatabase().
   - Code.gs tidak menghapus sheet atau baris lama.
   - Jika sheet ORDER_BUKU/ORDER_ARTIKEL/ORDER_IJP sudah ada, kolom Link Drive/KMT hanya dipastikan tersedia.

6. PENTING:
   Jangan menjalankan fungsi yang menghapus/menginisialisasi database lama. Project ini tidak membutuhkan setupDatabase().
