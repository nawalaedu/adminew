/************************************************************
 * ADMIN MANAGEMENT - GOOGLE APPS SCRIPT API
 *
 * GitHub Pages HTML -> api.js -> JSONP -> Google Apps Script
 *
 * VERSI: kompatibel dengan skema lama + skema baru
 * Buku    : ORDER_BUKU, AUTHOR_BUKU, INVOICE_BUKU, ISBN_BUKU,
 *           HKI_BUKU, HASIL_BUKU
 * Artikel : ORDER_ARTIKEL, AUTHOR_ARTIKEL, INVOICE_ARTIKEL,
 *           RISET_ARTIKEL
 * IJP     : ORDER_IJP, INVOICE_IJP, HASIL_IJP
 *
 * CATATAN:
 * - TIDAK ADA setupDatabase().
 * - Tidak menghapus sheet/data lama.
 * - Kolom KMT/Link Drive hanya ditambahkan bila belum tersedia.
 * - JSONP dipertahankan agar GitHub Pages tetap dapat berkomunikasi
 *   dengan Web App GAS tanpa masalah CORS.
 ************************************************************/

const CONFIG = {
  API_KEY: 'ADMIN-515KA',
  DB: {
    BUKU: '1wloSgV44Alewr6qubwO2_oqjqT3Dbqmd9NBMKhgPBIw',
    ARTIKEL: '14oEPpJJ_6G76rkVJtKDX7MgxPVHZIBzUvpvghv7iZhw',
    DATA: '1CWswwCkaGGhaNWJ31RSyd3O8EctNhySxu_oCW9TKRas',
    IJP: '1jBpSJaYwLX6oLAzSh4AO7G0-KcZjXhDnDBesSDjwEwo'
  }
};

const SHEETS = {
  BUKU: {
    ORDER: 'ORDER_BUKU', AUTHOR: 'AUTHOR_BUKU', INVOICE: 'INVOICE_BUKU',
    ISBN: 'ISBN_BUKU', HKI: 'HKI_BUKU', HASIL: 'HASIL_BUKU'
  },
  ARTIKEL: {
    ORDER: 'ORDER_ARTIKEL', AUTHOR: 'AUTHOR_ARTIKEL', INVOICE: 'INVOICE_ARTIKEL',
    RISET: 'RISET_ARTIKEL'
  },
  IJP: {
    ORDER: 'ORDER_IJP', AUTHOR: 'AUTHOR_IJP', INVOICE: 'INVOICE_IJP', HASIL: 'HASIL_IJP'
  },
  DATA: { ORDER: 'ORDER DATA', INVOICE: 'INVOICE DATA', HASIL: 'HASIL DATA' }
};

const HEADERS = {
  BUKU_ORDER: ['Timestamp','ID Order','Jenis Buku','Judul Buku','Kategori','Rincian Bab','Jumlah Bab','Marketing','Tanggal','Authors','Link Drive'],
  BUKU_AUTHOR: ['Timestamp','ID Author','ID Order','Judul Buku','Marketing','Tanggal','Nama Author','Email','No Telp','Afiliasi','Bab'],
  BUKU_INVOICE: ['Timestamp','ID Invoice','ID Order','ID Author','Judul Buku','Nama Author','Bab','Marketing','Tanggal','Harga','Status Pembayaran','Nominal'],
  BUKU_ISBN: ['Timestamp','ID Order','Judul Buku','ISBN','Tanggal','Arsip'],
  BUKU_HKI: ['Timestamp','ID Order','Judul Buku','Nomor HKI','Tanggal','Arsip'],
  BUKU_HASIL: ['Timestamp','ID Order','Judul Buku','Tim Penyusun','Status','Arsip'],
  ART_ORDER: ['Timestamp','ID Order','Kode Jurnal','Judul Artikel','Bulan Terbit','Marketing','Tanggal','KMT','Link Drive'],
  ART_AUTHOR: ['Timestamp','ID Order','Judul Artikel','Kode Jurnal','Bulan Terbit','Marketing','Tanggal','Urutan Penulis','Nama Author','Email','Telp','Afiliasi'],
  ART_INVOICE: ['Timestamp','ID Invoice','ID Order','Kode Jurnal','Bulan Terbit','Judul Artikel','ID Penulis','Penulis Ke','Nama Penulis','Marketing','Tanggal','Harga','Status','Nominal'],
  ART_RISET: ['Timestamp','ID Order','Judul Artikel','Kode Jurnal','Bulan Terbit','Tim Riset','Arsip'],
  IJP_ORDER: ['Timestamp','ID Order','Kode Jurnal','Judul IJP','Bulan Terbit','Kategori Paket','Marketing','Tanggal','KMT','Link Drive'],
  IJP_AUTHOR: ['Timestamp','ID Author','ID Order','Judul IJP','Kode Jurnal','Bulan Terbit','Marketing','Tanggal','Urutan Penulis','Nama Author','Email','Telp','Afiliasi'],
  IJP_INVOICE: ['Timestamp','ID Invoice','ID Order','Kode Jurnal','Bulan Terbit','Judul IJP','ID Penulis','Penulis Ke','Nama Penulis','Marketing','Tanggal','Harga','Status','Nominal'],
  IJP_HASIL: ['Timestamp','ID Order','Kode Jurnal','Judul IJP','Bulan Terbit','Tim IJP','Arsip']
};

/* ============================================================
   ENTRY POINT
============================================================ */
function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};

    if (String(p.action || '') === 'ping') {
      return jsonp({success:true, message:'API aktif'}, p.callback);
    }

    if (p.key !== CONFIG.API_KEY) {
      return jsonp({success:false, message:'API KEY tidak valid'}, p.callback);
    }

    let method = String(p.method || p.action || '').trim();
    if (!method) return jsonp({success:false, message:'Method/action kosong'}, p.callback);

    let args = [];
    if (p.data) {
      let raw = p.data;
      try { raw = decodeURIComponent(raw); } catch (_) {}
      args = JSON.parse(raw);
      if (!Array.isArray(args)) args = [args];
    } else if (p.idOrder) {
      args = [{idOrder:p.idOrder}];
    }

    const result = dispatch(method, args);
    return jsonp(result, p.callback);
  } catch (err) {
    return jsonp({success:false, message:err.message, stack:err.stack || ''}, e && e.parameter ? e.parameter.callback : 'callback');
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const key = body.key || '';
    // POST lama/baru dapat berjalan tanpa key; jika key dikirim, tetap divalidasi.
    if (key && key !== CONFIG.API_KEY) return jsonOutput({success:false, message:'API KEY tidak valid'});
    const action = String(body.action || body.method || '').trim();
    const data = body.data === undefined ? {} : body.data;
    if (!action) return jsonOutput({success:false, message:'Action/method kosong'});
    const args = Array.isArray(data) ? data : [data];
    return jsonOutput(dispatch(action, args));
  } catch (err) {
    return jsonOutput({success:false, message:err.message, stack:err.stack || ''});
  }
}

function dispatch(method, args) {
  const data = args && args.length ? args[0] : {};
  switch (method) {
    /* generic compatibility */
    case 'ambilDaftarOrder': return getGenericOrderList(args[0]);
    case 'ambilDetailOrder': return getGenericOrderDetail(args[0]);
    case 'simpanOrder': return saveGenericOrder(data);
    case 'simpanAuthor': return saveGenericAuthor(data);
    case 'simpanInvoice': return simpanInvoiceBuku(data);
    case 'simpanISBN': return simpanISBNBuku(data);
    case 'simpanHKI': return simpanHKIBuku(data);
    case 'ambilDetailAuthor': return ambilDetailAuthorBuku(data);

    /* BUKU */
    case 'simpanOrderBuku': return simpanOrderBuku(data);
    case 'ambilDaftarOrderBuku': return ambilDaftarOrderBuku();
    case 'ambilDetailOrderBuku': return ambilDetailOrderBuku(data);
    case 'simpanAuthorBuku': return simpanAuthorBuku(data);
    case 'ambilDaftarAuthorBuku': return ambilDaftarAuthorBuku(data);
    case 'ambilDetailAuthorBuku': return ambilDetailAuthorBuku(data);
    case 'ambilOrderBukuUntukInvoice': return ambilOrderBukuUntukInvoice(data);
    case 'ambilOrderUntukInvoice': return ambilOrderBukuUntukInvoice(data);
    case 'simpanInvoiceBuku': return simpanInvoiceBuku(data);
    case 'simpanISBNBuku': return simpanISBNBuku(data);
    case 'ambilDaftarISBNBuku': return ambilDaftarISBNBuku();
    case 'simpanHKIBuku': return simpanHKIBuku(data);
    case 'ambilDaftarHKIBuku': return ambilDaftarHKIBuku();
    case 'simpanHasilBuku': return simpanHasilBuku(data);
    case 'ambilDaftarHasilBuku': return ambilDaftarHasilBuku();
    case 'ambilHasilBuku': return ambilDetailHasilBuku(data);

    /* ARTIKEL */
    case 'simpanOrderArtikel': return simpanOrderArtikel(data);
    case 'ambilDaftarOrderArtikel': return ambilDaftarOrderArtikel();
    case 'ambilDetailOrderArtikel': return ambilDetailOrderArtikel(data);
    case 'simpanAuthorArtikel': return simpanAuthorArtikel(data);
    case 'ambilDetailPenulisArtikel': return ambilDetailPenulisArtikel(data);
    case 'ambilOrderArtikelUntukInvoice': return ambilOrderArtikelUntukInvoice(data);
    case 'simpanInvoiceArtikel': return simpanInvoiceArtikel(data);
    case 'simpanRisetArtikel': return simpanRisetArtikel(data);

    /* IJP */
    case 'simpanOrderIJP': return simpanOrderIJP(data);
    case 'ambilDaftarOrderIJP': return ambilDaftarOrderIJP();
    case 'ambilDetailOrderIJP': return ambilDetailOrderIJP(data);
    case 'simpanAuthorIJP': return simpanAuthorIJP(data);
    case 'ambilDetailPenulisIJP': return ambilDetailPenulisIJP(data);
    case 'ambilOrderIJPUntukInvoice': return ambilOrderIJPUntukInvoice(data);
    case 'simpanInvoiceIJP': return simpanInvoiceIJP(data);
    case 'simpanHasilIJP': return simpanHasilIJP(data);

    /* DATA: tetap kompatibel dengan project lama */
    case 'ambilDaftarOrderData':
    case 'ambilDaftarOrderOlahData': return getRows(CONFIG.DB.DATA, SHEETS.DATA.ORDER).filter(x => x.idOrder);
    case 'ambilDetailOrderData':
    case 'ambilDetailOrderOlahData': return getOrderDetail(CONFIG.DB.DATA, SHEETS.DATA.ORDER, getId(data));
    case 'ambilOrderDataUntukInvoice': return getOrderDetail(CONFIG.DB.DATA, SHEETS.DATA.ORDER, getId(data));
    case 'simpanInvoiceOlahData': return saveDynamic(CONFIG.DB.DATA, SHEETS.DATA.INVOICE, data, 'INV/DATA/');
    case 'simpanHasilData': return saveDynamic(CONFIG.DB.DATA, SHEETS.DATA.HASIL, data, 'HAS/DATA/');

    default: throw new Error('Method tidak terdaftar: ' + method);
  }
}

/* ============================================================
   BUKU
============================================================ */
function simpanOrderBuku(data) {
  const sheet = ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.ORDER, HEADERS.BUKU_ORDER);
  ensureHeader(sheet, 'Link Drive', 11);
  const idOrder = nextSequentialId(sheet, 'ORD-BK-');
  const jenis = String(data.jenisPenulisan || data.jenisBuku || '-').trim();
  const link = isMandiriBuku(jenis) ? getLinkDrive(data) : '';
  appendExact(sheet, [new Date(), idOrder, jenis, data.judulBuku || '-', data.kategori || '-', data.rincianBab || '-', data.jumlahBab || '-', data.marketingInput || data.marketing || '-', data.tanggal || '-', JSON.stringify(data.authors || []), link]);
  return {success:true, message:'Order Buku berhasil disimpan.', idOrder:idOrder, jenisBuku:jenis, jenisPenulisan:jenis, linkDrive:link};
}

function ambilDaftarOrderBuku() {
  const sheet = ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.ORDER, HEADERS.BUKU_ORDER);
  ensureHeader(sheet, 'Link Drive', 11);
  return getRowsFromSheet(sheet).filter(r => r[1]).map(r => bukuOrderObject(r));
}

function ambilDetailOrderBuku(data) {
  const id = getId(data); if (!id) throw new Error('ID Order tidak boleh kosong.');
  const row = ambilDaftarOrderBuku().find(x => String(x.idOrder) === String(id));
  return row ? Object.assign({success:true}, row) : null;
}

function simpanAuthorBuku(data) {
  const sheet = ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.AUTHOR, HEADERS.BUKU_AUTHOR);
  const id = data.idAuthor || nextSequentialId(sheet, 'AUT-BK-');
  const a = data.author || {};
  appendExact(sheet, [new Date(), id, data.idOrder || '-', data.judulBuku || '-', data.marketingInput || data.marketing || '-', data.tanggal || '-', a.nama || '-', a.email || '-', a.telp || '-', a.afiliasi || '-', Array.isArray(a.bab) ? a.bab.join(', ') : (a.bab || '-')]);
  return {success:true, message:'Author Buku berhasil disimpan.', idAuthor:id};
}

function ambilDaftarAuthorBuku(data) {
  const rows = getRowsFromSheet(ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.AUTHOR, HEADERS.BUKU_AUTHOR));
  const id = getId(data);
  return rows.filter(r => r[1] && (!id || String(r[2]) === String(id))).map(bukuAuthorObject);
}
function ambilDetailAuthorBuku(data) {
  const id = data && (data.idAuthor || data.authorId || data.idPenulis || data.id); if (!id) throw new Error('ID Author tidak boleh kosong.');
  return ambilDaftarAuthorBuku({}).find(x => String(x.idAuthor) === String(id)) || null;
}
function ambilOrderBukuUntukInvoice(data) {
  const order = ambilDetailOrderBuku(data); if (!order) throw new Error('Order Buku tidak ditemukan.');
  return Object.assign({}, order, {authors: ambilDaftarAuthorBuku({idOrder:order.idOrder})});
}
function simpanInvoiceBuku(data) {
  const sheet = ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.INVOICE, HEADERS.BUKU_INVOICE);
  const id = data.idInvoice || nextSequentialId(sheet, 'INV-BK-');
  appendExact(sheet, [new Date(), id, data.idOrder || '-', data.idAuthor || '-', data.judulBuku || '-', data.namaAuthor || '-', data.bab || '-', data.marketingInput || data.marketing || '-', data.tanggal || '-', data.harga || 0, data.statusPembayaran || '-', data.nominal || 0]);
  return {success:true, message:'Invoice Buku berhasil disimpan.', idInvoice:id};
}
function simpanISBNBuku(data) {
  const sheet = ensureSheet(CONFIG.DB.BUKU, SHEETS.BUKU.ISBN, HEADERS.BUKU_ISBN);
  appendExact(sheet, [new Date(), data.idOrder || '-', data.judulBuku || '-', data.isbn || '-', data.tanggal || '-', data.arsip || '-']);
  return {success:true, message:'ISBN Buku berhasil disimpan.'};
}
function ambilDaftarISBNBuku() { return getRowsFromSheet(ensureSheet(CONFIG.DB.BUKU,SHEETS.BUKU.ISBN,HEADERS.BUKU_ISBN)).map(r=>({idOrder:r[1]||'',judulBuku:r[2]||'',isbn:r[3]||'',tanggal:formatDate(r[4]),arsip:r[5]||''})); }
function simpanHKIBuku(data) {
  const sheet=ensureSheet(CONFIG.DB.BUKU,SHEETS.BUKU.HKI,HEADERS.BUKU_HKI);
  appendExact(sheet,[new Date(),data.idOrder||'-',data.judulBuku||'-',data.nomorHKI||'-',data.tanggal||'-',data.linkArsip||data.arsip||'-']);
  return {success:true,message:'HKI Buku berhasil disimpan.'};
}
function ambilDaftarHKIBuku(){return getRowsFromSheet(ensureSheet(CONFIG.DB.BUKU,SHEETS.BUKU.HKI,HEADERS.BUKU_HKI)).map(r=>({idOrder:r[1]||'',judulBuku:r[2]||'',nomorHKI:r[3]||'',tanggal:formatDate(r[4]),arsip:r[5]||''}));}
function simpanHasilBuku(data){const s=ensureSheet(CONFIG.DB.BUKU,SHEETS.BUKU.HASIL,HEADERS.BUKU_HASIL);appendExact(s,[new Date(),data.idOrder||'-',data.judulBuku||'-',data.timPenyusun||'-',data.status||'Selesai',data.arsip||'-']);return {success:true,message:'Hasil Buku berhasil disimpan.'};}
function ambilDaftarHasilBuku(){return getRowsFromSheet(ensureSheet(CONFIG.DB.BUKU,SHEETS.BUKU.HASIL,HEADERS.BUKU_HASIL)).map(r=>({idOrder:r[1]||'',judulBuku:r[2]||'',timPenyusun:r[3]||'',status:r[4]||'',arsip:r[5]||''}));}
function ambilDetailHasilBuku(data){const id=getId(data);return ambilDaftarHasilBuku().find(x=>String(x.idOrder)===String(id))||null;}

/* ============================================================
   ARTIKEL
============================================================ */
function simpanOrderArtikel(data){
  const s=ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.ORDER,HEADERS.ART_ORDER); ensureHeader(s,'KMT',8); ensureHeader(s,'Link Drive',9);
  const id=nextSequentialId(s,'ORD/ART/'); const kmt=getKmt(data); const link=kmt==='M'?getLinkDrive(data):'-';
  appendExact(s,[new Date(),id,data.kodeJurnal||'-',data.judulArtikel||'-',data.bulanTerbit||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',kmt||'-',link]);
  const out={success:true,idOrder:id,kmt:kmt,linkDrive:link}; if(kmt==='M'&&!link) out.warning='KMT = M, tetapi Link Drive belum diisi.'; return out;
}
function ambilDaftarOrderArtikel(){return getRowsFromSheet(ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.ORDER,HEADERS.ART_ORDER)).filter(r=>r[1]).map(r=>artikelOrderObject(r));}
function ambilDetailOrderArtikel(data){const id=getId(data);return ambilDaftarOrderArtikel().find(x=>String(x.idOrder)===String(id))||null;}
function simpanAuthorArtikel(data){const s=ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.AUTHOR,HEADERS.ART_AUTHOR);const a=data.author||{};const id=data.idAuthor||nextSequentialId(s,'AUT/ART/');appendExact(s,[new Date(),data.idOrder||'-',data.judulArtikel||'-',data.kodeJurnal||'-',data.bulanTerbit||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',data.urutanPenulis||'-',a.nama||'-',a.email||'-',a.telp||'-',a.afiliasi||'-']);return {success:true,idAuthor:id};}
function ambilDetailPenulisArtikel(data){const id=data&&(data.idAuthor||data.idPenulis||data.authorId||data.id);const rows=getRowsFromSheet(ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.AUTHOR,HEADERS.ART_AUTHOR));const r=rows.find(x=>String(x[1])===String(id));return r?artikelAuthorObject(r):null;}
function ambilOrderArtikelUntukInvoice(data){const o=ambilDetailOrderArtikel(data);if(!o)return null;const authors=getRowsFromSheet(ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.AUTHOR,HEADERS.ART_AUTHOR)).filter(r=>String(r[1])===String(o.idOrder)).map(artikelAuthorObject);return Object.assign({},o,{authors:authors});}
function simpanInvoiceArtikel(data){const s=ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.INVOICE,HEADERS.ART_INVOICE);const id=data.idInvoice||nextSequentialId(s,'INV/ART/');appendExact(s,[new Date(),id,data.idOrder||'-',data.kodeJurnal||'-',data.bulanTerbit||'-',data.judulArtikel||'-',data.idPenulis||'-',data.penulisKe||'-',data.namaPenulis||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',data.harga||0,data.statusPembayaran||data.status||'-',data.nominal||0]);return {success:true,idInvoice:id};}
function simpanRisetArtikel(data){const s=ensureSheet(CONFIG.DB.ARTIKEL,SHEETS.ARTIKEL.RISET,HEADERS.ART_RISET);appendExact(s,[new Date(),data.idOrder||'-',data.judulArtikel||'-',data.kodeJurnal||'-',data.bulanTerbit||'-',data.timRiset||'-',data.arsip||'-']);return {success:true};}

/* ============================================================
   IJP
============================================================ */
function simpanOrderIJP(data){const s=ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.ORDER,HEADERS.IJP_ORDER);ensureHeader(s,'KMT',9);ensureHeader(s,'Link Drive',10);const id=nextSequentialId(s,'ORD/IJP/');const kmt=getKmt(data);const link=kmt==='M'?getLinkDrive(data):'-';appendExact(s,[new Date(),id,data.kodeJurnal||'-',data.judulIJP||'-',data.bulanTerbit||'-',data.kategoriPaket||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',kmt||'-',link]);const out={success:true,idOrder:id,kmt:kmt,linkDrive:link};if(kmt==='M'&&!link)out.warning='KMT = M, tetapi Link Drive belum diisi.';return out;}
function ambilDaftarOrderIJP(){return getRowsFromSheet(ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.ORDER,HEADERS.IJP_ORDER)).filter(r=>r[1]).map(r=>ijpOrderObject(r));}
function ambilDetailOrderIJP(data){const id=getId(data);return ambilDaftarOrderIJP().find(x=>String(x.idOrder)===String(id))||null;}
function simpanAuthorIJP(data){const s=ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.AUTHOR,HEADERS.IJP_AUTHOR);const a=data.author||{};const id=data.idAuthor||nextSequentialId(s,'AUT/IJP/');appendExact(s,[new Date(),id,data.idOrder||'-',data.judulIJP||'-',data.kodeJurnal||'-',data.bulanTerbit||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',data.urutanPenulis||'-',a.nama||'-',a.email||'-',a.telp||'-',a.afiliasi||'-']);return {success:true,idAuthor:id};}
function ambilDetailPenulisIJP(data){const id=data&&(data.idAuthor||data.idPenulis||data.authorId||data.id);const rows=getRowsFromSheet(ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.AUTHOR,HEADERS.IJP_AUTHOR));const r=rows.find(x=>String(x[1])===String(id));return r?ijpAuthorObject(r):null;}
function ambilOrderIJPUntukInvoice(data){const o=ambilDetailOrderIJP(data);if(!o)return null;const authors=getRowsFromSheet(ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.AUTHOR,HEADERS.IJP_AUTHOR)).filter(r=>String(r[2])===String(o.idOrder)).map(ijpAuthorObject);return Object.assign({},o,{authors:authors});}
function simpanInvoiceIJP(data){const s=ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.INVOICE,HEADERS.IJP_INVOICE);const id=data.idInvoice||nextSequentialId(s,'INV/IJP/');appendExact(s,[new Date(),id,data.idOrder||'-',data.kodeJurnal||'-',data.bulanTerbit||'-',data.judulIJP||'-',data.idPenulis||'-',data.penulisKe||'-',data.namaPenulis||'-',data.marketingInput||data.marketing||'-',data.tanggal||'-',data.harga||0,data.statusPembayaran||data.status||'-',data.nominal||0]);return {success:true,idInvoice:id};}
function simpanHasilIJP(data){const s=ensureSheet(CONFIG.DB.IJP,SHEETS.IJP.HASIL,HEADERS.IJP_HASIL);appendExact(s,[new Date(),data.idOrder||'-',data.kodeJurnal||'-',data.judulIJP||'-',data.bulanTerbit||'-',data.timIJP||'-',data.arsip||'-']);return {success:true};}

/* ============================================================
   GENERIC / LEGACY COMPATIBILITY
============================================================ */
function saveGenericOrder(data){const page=String((data&&data._page)||'buku').toLowerCase();if(page==='artikel')return simpanOrderArtikel(data);if(page==='ijp')return simpanOrderIJP(data);return simpanOrderBuku(data);}
function saveGenericAuthor(data){const page=String((data&&data._page)||'buku').toLowerCase();if(page==='artikel')return simpanAuthorArtikel(data);if(page==='ijp')return simpanAuthorIJP(data);return simpanAuthorBuku(data);}
function getGenericOrderList(page){page=typeof page==='object'&&page?page._page:page;page=String(page||'buku').toLowerCase();if(page==='artikel')return ambilDaftarOrderArtikel();if(page==='ijp')return ambilDaftarOrderIJP();return ambilDaftarOrderBuku();}
function getGenericOrderDetail(data){data=data||{};const page=String(data._page||'buku').toLowerCase();if(page==='artikel')return ambilDetailOrderArtikel(data);if(page==='ijp')return ambilDetailOrderIJP(data);return ambilDetailOrderBuku(data);}

/* ============================================================
   HELPERS
============================================================ */
function ensureSheet(db,name,headers){const ss=SpreadsheetApp.openById(db);let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0&&headers&&headers.length){s.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e2e8f0');s.setFrozenRows(1);}return s;}
function ensureHeader(sheet,header,column){const max=Math.max(sheet.getLastColumn(),column);if(sheet.getMaxColumns()<max)sheet.insertColumnsAfter(sheet.getMaxColumns(),max-sheet.getMaxColumns());const cell=sheet.getRange(1,column);if(!cell.getValue())cell.setValue(header).setFontWeight('bold').setBackground('#e2e8f0');sheet.setFrozenRows(1);}
function appendExact(sheet,row){const n=row.length;if(sheet.getMaxColumns()<n)sheet.insertColumnsAfter(sheet.getMaxColumns(),n-sheet.getMaxColumns());sheet.getRange(sheet.getLastRow()+1,1,1,n).setValues([row]);}
function getRowsFromSheet(sheet){if(sheet.getLastRow()<2)return [];const width=Math.max(sheet.getLastColumn(),1);return sheet.getRange(1,1,sheet.getLastRow(),width).getValues();}
function nextSequentialId(sheet,prefix){const rows=getRowsFromSheet(sheet);let max=0;rows.slice(1).forEach(r=>r.forEach(v=>{const s=String(v||'');if(s.indexOf(prefix)===0){const n=parseInt(s.substring(prefix.length),10);if(!isNaN(n))max=Math.max(max,n);}}));return prefix+String(max+1).padStart(3,'0');}
function getRows(db,name){return getObjectRows(ensureSheet(db,name,[]));}
function getObjectRows(sheet){const vals=getRowsFromSheet(sheet);if(vals.length<2)return [];const headers=vals[0].map(v=>String(v).trim());return vals.slice(1).filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};headers.forEach((h,i)=>{if(h)o[h]=r[i];});return o;});}
function getOrderDetail(db,name,id){if(!id)return null;return getObjectRows(ensureSheet(db,name,[])).find(x=>String(x['ID Order']||x.idOrder)===String(id))||null;}
function saveDynamic(db,name,data,prefix){data=Object.assign({},data||{});if(!data.idOrder&&prefix.indexOf('ORD/')===0)data.idOrder=nextSequentialId(ensureSheet(db,name,[]),prefix);if(!data.idInvoice&&prefix.indexOf('INV/')===0)data.idInvoice=nextSequentialId(ensureSheet(db,name,[]),prefix);const s=ensureSheet(db,name,[]);let headers=s.getLastColumn()?s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String):[];Object.keys(data).forEach(k=>{if(headers.indexOf(k)<0)headers.push(k);});if(!headers.length)throw new Error('Tidak ada data untuk disimpan');s.getRange(1,1,1,headers.length).setValues([headers]);s.getRange(s.getLastRow()+1,1,1,headers.length).setValues([headers.map(h=>serialize(data[h]))]);return Object.assign({success:true},data);}
function serialize(v){if(v===undefined||v===null)return '';return typeof v==='object'?JSON.stringify(v):v;}
function getId(data){if(typeof data==='string')return data;return data&&(data.idOrder||data.orderId||data.id||data.value)||'';}
function getKmt(data){return String((data&& (data.kmt||data.KMT||data.kmtInput))||'').trim().toUpperCase();}
function getLinkDrive(data){return String((data&&(data.linkDrive||data.LinkDrive||data.link_drive||data.driveLink||data.urlDrive))||'').trim();}
function isMandiriBuku(v){const x=String(v||'').trim().toLowerCase();return x==='mandiri'||x==='naskah mandiri';}
function formatDate(v){if(!v)return '';if(Object.prototype.toString.call(v)==='[object Date]')return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');return String(v);}
function bukuOrderObject(r){const jenis=r[2]||'';let authors=[];try{authors=r[9]?JSON.parse(r[9]):[];}catch(_){authors=[];}return {idOrder:String(r[1]||''),jenisBuku:jenis,jenisPenulisan:jenis,judulBuku:r[3]||'',kategori:r[4]||'',rincianBab:r[5]||'',jumlahBab:r[6]||'',marketingInput:r[7]||'',marketing:r[7]||'',tanggal:formatDate(r[8]),authors:authors,linkDrive:isMandiriBuku(jenis)?String(r[10]||''):''};}
function bukuAuthorObject(r){return {idAuthor:String(r[1]||''),idOrder:String(r[2]||''),judulBuku:r[3]||'',marketingInput:r[4]||'',tanggal:formatDate(r[5]),namaAuthor:r[6]||'',namaPenulis:r[6]||'',email:r[7]||'',telp:r[8]||'',afiliasi:r[9]||'',bab:r[10]||''};}
function artikelOrderObject(r){return {idOrder:String(r[1]||''),kodeJurnal:r[2]||'',judulArtikel:r[3]||'',bulanTerbit:r[4]||'',marketing:r[5]||'',marketingInput:r[5]||'',tanggal:formatDate(r[6]),kmt:r[7]||'',linkDrive:r[8]||''};}
function artikelAuthorObject(r){return {idAuthor:String(r[1]||''),idOrder:String(r[1]||''),judulArtikel:r[2]||'',kodeJurnal:r[3]||'',bulanTerbit:r[4]||'',marketingInput:r[5]||'',tanggal:formatDate(r[6]),penulisKe:r[7]||'',urutanPenulis:r[7]||'',namaAuthor:r[8]||'',namaPenulis:r[8]||'',email:r[9]||'',telp:r[10]||'',afiliasi:r[11]||''};}
function ijpOrderObject(r){return {idOrder:String(r[1]||''),kodeJurnal:r[2]||'',judulIJP:r[3]||'',bulanTerbit:r[4]||'',kategoriPaket:r[5]||'',marketing:r[6]||'',marketingInput:r[6]||'',tanggal:formatDate(r[7]),kmt:r[8]||'',linkDrive:r[9]||''};}
function ijpAuthorObject(r){return {idAuthor:String(r[1]||''),idOrder:String(r[2]||''),judulIJP:r[3]||'',kodeJurnal:r[4]||'',bulanTerbit:r[5]||'',marketingInput:r[6]||'',tanggal:formatDate(r[7]),penulisKe:r[8]||'',urutanPenulis:r[8]||'',namaAuthor:r[9]||'',namaPenulis:r[9]||'',email:r[10]||'',telp:r[11]||'',afiliasi:r[12]||''};}
function jsonp(data,callback){callback=String(callback||'callback').replace(/[^A-Za-z0-9_$]/g,'');return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+')').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function jsonOutput(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
