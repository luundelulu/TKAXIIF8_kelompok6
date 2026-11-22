// Script sederhana untuk menampilkan data survei.
// Data ada di data.js (variabel DATA).

var pertanyaan = DATA.pertanyaan;
var responden = DATA.responden;
var namaAspek = ["Pemahaman dasar", "Persiapan", "Kesiapan"];

// hitung jumlah jawaban Ya dari satu responden
function hitungYa(r) {
  var total = 0;
  for (var i = 0; i < r.jawaban.length; i++) {
    total += r.jawaban[i];
  }
  return total;
}

function persen(bagian, total) {
  return total === 0 ? 0 : (bagian / total) * 100;
}

function format(angka) {
  return angka.toFixed(1).replace(".", ",") + "%";
}

// ---------- Ringkasan ----------
function tampilRingkasan() {
  var totalYa = 0;
  for (var i = 0; i < responden.length; i++) {
    totalYa += hitungYa(responden[i]);
  }
  var totalJawaban = responden.length * pertanyaan.length;

  var isi = [
    ["Responden", responden.length],
    ["Total jawaban Ya", totalYa],
    ["Total jawaban Tidak", totalJawaban - totalYa],
    ["Rata-rata Ya", format(persen(totalYa, totalJawaban))]
  ];

  var html = "";
  for (var j = 0; j < isi.length; j++) {
    html += '<div class="kartu"><b>' + isi[j][1] + "</b><span>" + isi[j][0] + "</span></div>";
  }
  document.getElementById("ringkasan").innerHTML = html;
  document.getElementById("jumlah").textContent = responden.length;
}

// jumlah Ya untuk satu pernyataan (index 0-19)
function yaPerPertanyaan(index) {
  var total = 0;
  for (var i = 0; i < responden.length; i++) {
    total += responden[i].jawaban[index];
  }
  return total;
}

// ---------- Per aspek ----------
function tampilAspek() {
  var html = "";
  for (var a = 0; a < namaAspek.length; a++) {
    var ya = 0;
    var jumlahSoal = 0;
    for (var i = 0; i < pertanyaan.length; i++) {
      if (pertanyaan[i].aspek === namaAspek[a]) {
        ya += yaPerPertanyaan(i);
        jumlahSoal++;
      }
    }
    var p = persen(ya, jumlahSoal * responden.length);
    html += '<div class="baris">' + namaAspek[a] + " (" + jumlahSoal + " pernyataan) - " + format(p) +
            '<div class="bar"><div style="width:' + p + '%"></div></div></div>';
  }
  document.getElementById("aspek").innerHTML = html;
}

// ---------- Tabel pernyataan ----------
function tampilPertanyaan() {
  var html = "";
  for (var i = 0; i < pertanyaan.length; i++) {
    var ya = yaPerPertanyaan(i);
    html += "<tr><td>" + pertanyaan[i].no + "</td><td>" + pertanyaan[i].teks + "</td><td>" +
            pertanyaan[i].aspek + "</td><td>" + ya + "/" + responden.length +
            " (" + format(persen(ya, responden.length)) + ")</td></tr>";
  }
  document.getElementById("tabel-pertanyaan").innerHTML = html;
}

// ---------- Tabel responden ----------
var yangTerbuka = {}; // nama responden yang detailnya sedang dibuka

function tampilResponden() {
  var kata = document.getElementById("cari").value.toLowerCase();
  var urut = document.getElementById("urut").value;

  // saring berdasarkan nama
  var daftar = responden.filter(function (r) {
    return r.nama.toLowerCase().indexOf(kata) !== -1;
  });

  // urutkan
  daftar.sort(function (a, b) {
    if (urut === "tinggi") return hitungYa(b) - hitungYa(a);
    if (urut === "rendah") return hitungYa(a) - hitungYa(b);
    return a.nama.localeCompare(b.nama);
  });

  var html = "";
  for (var i = 0; i < daftar.length; i++) {
    var r = daftar[i];
    var ya = hitungYa(r);
    var buka = yangTerbuka[r.nama];
    html += "<tr><td>" + r.nama + "</td><td>" + r.tanggal + "</td><td>" + ya + "</td><td>" +
            (pertanyaan.length - ya) + '</td><td><button data-nama="' + r.nama + '">' +
            (buka ? "Tutup" : "Detail") + "</button></td></tr>";

    if (buka) {
      html += '<tr class="detail"><td colspan="5"><ul>';
      for (var j = 0; j < pertanyaan.length; j++) {
        var jawab = r.jawaban[j] === 1 ? '<span class="ya">Ya</span>' : '<span class="tidak">Tidak</span>';
        html += "<li>" + pertanyaan[j].no + ". " + pertanyaan[j].teks + " - " + jawab + "</li>";
      }
      html += "</ul></td></tr>";
    }
  }
  if (daftar.length === 0) {
    html = '<tr><td colspan="5">Tidak ada responden yang cocok.</td></tr>';
  }
  document.getElementById("tabel-responden").innerHTML = html;
}

// klik tombol Detail / Tutup
document.getElementById("tabel-responden").addEventListener("click", function (e) {
  var nama = e.target.getAttribute("data-nama");
  if (nama) {
    yangTerbuka[nama] = !yangTerbuka[nama];
    tampilResponden();
  }
});

document.getElementById("cari").addEventListener("input", tampilResponden);
document.getElementById("urut").addEventListener("change", tampilResponden);

// jalankan saat halaman dibuka
tampilRingkasan();
tampilAspek();
tampilPertanyaan();
tampilResponden();


// ---------- Pindah tampilan (navbar) ----------
var tombolMenu = document.querySelectorAll(".menu button");
function bukaTampilan(nama) {
  var semua = document.querySelectorAll(".view");
  for (var i = 0; i < semua.length; i++) {
    semua[i].hidden = semua[i].id !== "view-" + nama;
  }
  for (var j = 0; j < tombolMenu.length; j++) {
    tombolMenu[j].className = tombolMenu[j].getAttribute("data-view") === nama ? "aktif" : "";
  }
  if (nama === "graf") ukurGraf();
  window.scrollTo(0, 0);
}
for (var t = 0; t < tombolMenu.length; t++) {
  tombolMenu[t].addEventListener("click", function () {
    bukaTampilan(this.getAttribute("data-view"));
  });
}

// ---------- Graf ----------
var NS = "http://www.w3.org/2000/svg";
var svg = document.getElementById("graf-svg");
var kotak = document.getElementById("graf-box");
var popup = document.getElementById("popup");
var singkatAspek = ["Pemahaman", "Persiapan", "Kesiapan"];

var lebar = 0, tinggi = 0, R = 120, rNode = 7;
var zoom = 1, geserX = 0, geserY = 0;
var sudutPutar = 0;          // sudut putaran cincin (radian), searah jarum jam
var berputar = true;         // tombol Putar/Jeda
var sedangHover = false;     // pause saat kursor di atas node
var dipilih = null;          // {tipe, index}

var dunia;                   // grup <g> utama
var elResp = [], elAspek = [], teksResp = [], garis = [];
var posAspek = [];

function buat(nama, atribut, induk) {
  var el = document.createElementNS(NS, nama);
  for (var k in atribut) el.setAttribute(k, atribut[k]);
  if (induk) induk.appendChild(el);
  return el;
}

function persenAspekResp(r, a) {
  var ya = 0, n = 0;
  for (var i = 0; i < pertanyaan.length; i++) {
    if (pertanyaan[i].aspek === namaAspek[a]) { ya += r.jawaban[i]; n++; }
  }
  return persen(ya, n);
}

function persenAspekSemua(a) {
  var ya = 0, n = 0;
  for (var i = 0; i < pertanyaan.length; i++) {
    if (pertanyaan[i].aspek === namaAspek[a]) { ya += yaPerPertanyaan(i); n++; }
  }
  return persen(ya, n * responden.length);
}

// makin banyak Ya, titik makin gelap
function warnaResp(r) {
  var tingkat = hitungYa(r) / pertanyaan.length;
  var g = Math.round(205 - tingkat * 105);
  return "rgb(" + g + "," + g + "," + (g + 8) + ")";
}

function gambarGraf() {
  dunia = buat("g", {}, svg);
  var gGaris = buat("g", {}, dunia);

  for (var i = 0; i < responden.length; i++) {
    garis.push([]);
    for (var a = 0; a < 3; a++) {
      var p = persenAspekResp(responden[i], a);
      garis[i].push(buat("line", { "class": "garis", "stroke-width": 0.5 + p / 50, "stroke-opacity": 0.12 }, gGaris));
    }
  }

  for (var a = 0; a < 3; a++) {
    (function (a) {
      var g = buat("g", { "class": "node aspek-node", tabindex: 0 }, dunia);
      buat("rect", { width: 30, height: 30, x: -15, y: -15, rx: 8, fill: "#555" }, g);
      var t = buat("text", { y: 30, "text-anchor": "middle" }, g);
      t.textContent = singkatAspek[a];
      g.addEventListener("click", function () { pilihAspek(a); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter") pilihAspek(a); });
      g.addEventListener("mouseenter", function () { sedangHover = true; });
      g.addEventListener("mouseleave", function () { sedangHover = false; });
      elAspek.push(g);
    })(a);
  }

  for (var i = 0; i < responden.length; i++) {
    (function (i) {
      var g = buat("g", { "class": "node", tabindex: 0 }, dunia);
      buat("circle", { r: rNode, fill: warnaResp(responden[i]) }, g);
      var t = buat("text", { "dominant-baseline": "middle" }, g);
      t.textContent = responden[i].nama.split(" ")[0];
      g.addEventListener("click", function () { pilihResponden(i); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter") pilihResponden(i); });
      g.addEventListener("mouseenter", function () { sedangHover = true; });
      g.addEventListener("mouseleave", function () { sedangHover = false; });
      elResp.push(g);
      teksResp.push(t);
    })(i);
  }
}

// ukuran graf menyesuaikan kotak (dipanggil saat awal, resize, dan buka tab Graf)
function ukurGraf() {
  lebar = kotak.clientWidth;
  tinggi = kotak.clientHeight;
  if (lebar === 0) return;
  R = Math.max(80, Math.min(lebar, tinggi) / 2 - 76);
  rNode = R < 150 ? 6 : 8;
  for (var i = 0; i < elResp.length; i++) {
    elResp[i].firstChild.setAttribute("r", rNode);
  }
  var rAspek = R * 0.36;
  posAspek = [];
  for (var a = 0; a < 3; a++) {
    var s = -Math.PI / 2 + a * (2 * Math.PI / 3);
    posAspek.push({ x: rAspek * Math.cos(s), y: rAspek * Math.sin(s) });
    elAspek[a].setAttribute("transform", "translate(" + posAspek[a].x + "," + posAspek[a].y + ")");
  }
  gambarUlang();
}

// hitung ulang posisi semua node (dipanggil tiap frame saat berputar)
function gambarUlang() {
  if (lebar === 0) return;
  dunia.setAttribute("transform", "translate(" + (lebar / 2 + geserX) + "," + (tinggi / 2 + geserY) +
                     ") scale(" + zoom + ")");
  var n = responden.length;
  for (var i = 0; i < n; i++) {
    var s = -Math.PI / 2 + sudutPutar + i * (2 * Math.PI / n);
    var c = Math.cos(s), sn = Math.sin(s);
    var x = R * c, y = R * sn;
    elResp[i].setAttribute("transform", "translate(" + x + "," + y + ")");

    // nama ditulis searah jari-jari lingkaran, dibalik di sisi kiri supaya tetap terbaca
    var derajat = s * 180 / Math.PI;
    var kiri = c < 0;
    teksResp[i].setAttribute("transform", "rotate(" + (kiri ? derajat + 180 : derajat) + ")");
    teksResp[i].setAttribute("x", kiri ? -(rNode + 5) : rNode + 5);
    teksResp[i].setAttribute("text-anchor", kiri ? "end" : "start");

    for (var a = 0; a < 3; a++) {
      var g = garis[i][a];
      g.setAttribute("x1", x); g.setAttribute("y1", y);
      g.setAttribute("x2", posAspek[a].x); g.setAttribute("y2", posAspek[a].y);
    }
  }
}

// animasi putar pelan
var waktuTerakhir = 0;
var kurangGerak = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function animasi(waktu) {
  var dt = (waktu - waktuTerakhir) / 1000;
  waktuTerakhir = waktu;
  if (dt > 0.1) dt = 0.016; // lompat saat tab tidak aktif
  if (berputar && !sedangHover && !dipilih && !kurangGerak && !document.hidden) {
    sudutPutar += dt * (2 * Math.PI / 150); // satu putaran 150 detik
    gambarUlang();
  }
  requestAnimationFrame(animasi);
}

// ---------- Pilih node ----------
function reset() {
  for (var i = 0; i < responden.length; i++) {
    elResp[i].setAttribute("class", "node");
    for (var a = 0; a < 3; a++) garis[i][a].setAttribute("stroke-opacity", 0.12);
  }
  for (var a = 0; a < 3; a++) elAspek[a].setAttribute("class", "node aspek-node");
}

function tampilPopup(html) {
  popup.innerHTML = '<button class="tutup" id="tutup">X</button>' + html;
  popup.hidden = false;
  document.getElementById("tutup").addEventListener("click", batalPilih);
}

function batalPilih() {
  reset();
  dipilih = null;
  popup.hidden = true;
}

function pilihResponden(i) {
  reset();
  dipilih = { tipe: "responden", index: i };
  var r = responden[i];
  elResp[i].setAttribute("class", "node aktif");
  for (var a = 0; a < 3; a++) garis[i][a].setAttribute("stroke-opacity", 0.8);

  var ya = hitungYa(r);
  var html = "<h3>" + r.nama + "</h3>" +
    "<div>Tanggal isi: " + r.tanggal + "</div>" +
    "<div>Ya: " + ya + " &middot; Tidak: " + (pertanyaan.length - ya) + " (" + format(persen(ya, pertanyaan.length)) + ")</div><ul>";
  for (var a = 0; a < 3; a++) {
    html += "<li>" + namaAspek[a] + ": " + format(persenAspekResp(r, a)) + "</li>";
  }
  html += "</ul>";
  var tidak = [];
  for (var j = 0; j < pertanyaan.length; j++) {
    if (r.jawaban[j] === 0) tidak.push("<li>" + pertanyaan[j].no + ". " + pertanyaan[j].teks + "</li>");
  }
  html += "<p><b>Dijawab Tidak:</b></p>" + (tidak.length ? "<ul>" + tidak.join("") + "</ul>" : "<div class='ket'>Tidak ada.</div>");
  tampilPopup(html);
}

function pilihAspek(a) {
  reset();
  dipilih = { tipe: "aspek", index: a };
  elAspek[a].setAttribute("class", "node aspek-node aktif");
  for (var i = 0; i < responden.length; i++) garis[i][a].setAttribute("stroke-opacity", 0.6);

  var html = "<h3>" + namaAspek[a] + "</h3><div>Rata-rata Ya: " + format(persenAspekSemua(a)) + "</div><ul>";
  for (var j = 0; j < pertanyaan.length; j++) {
    if (pertanyaan[j].aspek === namaAspek[a]) {
      html += "<li>" + pertanyaan[j].no + ". " + pertanyaan[j].teks + " (" + yaPerPertanyaan(j) + "/" + responden.length + " Ya)</li>";
    }
  }
  html += "</ul>";
  tampilPopup(html);
}

// ---------- Geser (drag) dan zoom ----------
var tarik = null;
svg.addEventListener("pointerdown", function (e) {
  if (e.target.closest(".node")) return;
  tarik = { x: e.clientX, y: e.clientY, gx: geserX, gy: geserY, gerak: false };
});
window.addEventListener("pointermove", function (e) {
  if (!tarik) return;
  var dx = e.clientX - tarik.x, dy = e.clientY - tarik.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) tarik.gerak = true;
  if (tarik.gerak) {
    geserX = tarik.gx + dx;
    geserY = tarik.gy + dy;
    gambarUlang();
  }
});
window.addEventListener("pointerup", function () {
  if (tarik && !tarik.gerak) batalPilih(); // klik area kosong
  tarik = null;
});

function ubahZoom(faktor) {
  zoom = Math.min(2.5, Math.max(0.5, zoom * faktor));
  gambarUlang();
}
document.getElementById("zoom-besar").addEventListener("click", function () { ubahZoom(1.25); });
document.getElementById("zoom-kecil").addEventListener("click", function () { ubahZoom(0.8); });
svg.addEventListener("wheel", function (e) {
  e.preventDefault();
  ubahZoom(e.deltaY < 0 ? 1.1 : 0.9);
}, { passive: false });

document.getElementById("putar").addEventListener("click", function () {
  berputar = !berputar;
  this.textContent = berputar ? "Jeda" : "Putar";
});

window.addEventListener("resize", ukurGraf);

// ---------- Jalankan ----------
tampilRingkasan();
tampilAspek();
tampilPertanyaan();
tampilResponden();
gambarGraf();
ukurGraf();
requestAnimationFrame(animasi);
