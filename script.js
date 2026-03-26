const spreadsheetId = '1hP9NKLSjiJX2tWKQOeDNIGLH8q5q_q1CevSL08oY1n4';
const yarisGecmisGid = '354299981';
const isimlerGid = '1391237604';

const takimLogolari = {
    'RedBull': 'Red_Bull_logo_PNG10.png',
    'Red Bull Racing': 'Red_Bull_logo_PNG10.png',
    'Ferrari': 'ferrari.png',
    'Mercedes': 'mercedes.png',
    'McLaren': 'mclaren.png',
    'Aston Martin': 'astonmartin.png',
    'Alpine': 'alpine.png',
    'Williams': 'williams.png',
    'Racing Bulls': 'rbvisacashapp.png',
    'RB': 'rbvisacashapp.png',
    'Kick Sauber': 'kicksauber.svg',
    'Haas': 'haas.png'
};

let pilotTakimlar = {
    'Omer_DeChavo': 'RB',
    'Ulaş Gökkaya': 'Kick Sauber',
    'emreuysal': 'Alpine',
    'ghostshelby7': 'RB',
    'Shaarl': 'Ferrari',
    'ozzer0': 'Red Bull Racing',
    'RaddEmir': 'Mercedes',
    'RodrigoBecao5031': 'McLaren',
    'semyhist': 'Williams',
    'soylu': 'Aston Martin',
    'TR_Adonis': 'Ferrari',
    'sdevrim': 'McLaren',
    'F1xEmma': 'Haas',
    'berkecangul': 'Aston Martin',
    'ERTKULA': 'Haas',
    'kumeji': 'Kick Sauber',
    'osurukbocegi14': 'Mercedes',
    'varttolisad': 'Alpine',
    'serefsamil': 'Red Bull Racing',
    'AlonsoLaren': 'Williams'
};
let pilotIsimler = {};
let pilotVerileri = [];
let takimVerileri = [];

// /*
// const teamsGid = '1303522310';
// takimlari sheeetten cekmeyi denedik olmadi
// pilotTakimlar = {};
// */

function sheetUrl(gid){
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
}

async function verileriCek(){
    const yukleniyor = document.getElementById('loading');
    const hata = document.getElementById('error');
    yukleniyor.style.display = 'block';
    hata.style.display = 'none';
    try {
        const isimRes = await fetch(sheetUrl(isimlerGid));
        const isimText = await isimRes.text();
        const isimData = JSON.parse(isimText.substring(47).slice(0, -2));
        if (isimData.table.rows) {
            isimData.table.rows.forEach((row, i) => {
                if (i === 0 || !row.c) return;
                const ad = row.c[0]?.v?.trim();
                const soyad = row.c[1]?.v?.trim();
                const kullaniciAdi = row.c[2]?.v?.trim();
                if (kullaniciAdi && ad && soyad) pilotIsimler[kullaniciAdi] = `${ad} ${soyad}`;
            });
        }
        if (!pilotIsimler['ghostshelby7']) pilotIsimler['ghostshelby7'] = 'ghostshelby7';
        if (!pilotIsimler['soylu']) pilotIsimler['soylu'] = 'Yusuf Soylu';
        const yarisRes = await fetch(sheetUrl(yarisGecmisGid));
        const yarisText = await yarisRes.text();
        const yarisData = JSON.parse(yarisText.substring(47).slice(0, -2));
        veriIsle(yarisData);
        yukleniyor.style.display = 'none';
    } catch(err) {
        console.error(err);
        console.log('test1');
        yukleniyor.style.display = 'none';
        hata.style.display = 'block';
    }
}

function veriIsle(data){
    const kolonlar = data.table.cols;
    const satirlar = data.table.rows;
    if (!kolonlar || !satirlar) {
        document.getElementById('error').style.display = 'block';
        return;
    }
    pilotVerileri = [];
    const takimPuanlari = {};
    const toplamYaris = satirlar.length;
    for (let k = 1; k < kolonlar.length; k++) { // 0. kolon GP adi
        const pilotAdi = kolonlar[k].label?.trim();
        if (!pilotAdi) continue;
        let toplamPuan = 0;
        let oncekiPuan = 0;
        for (let s = 0; s < satirlar.length; s++) {
            const satir = satirlar[s];
            if (!satir?.c?.[k]) continue;
            const hucre = satir.c[k];
            if (hucre?.v !== null && hucre?.v !== undefined) {
                const pozisyon = parseInt(hucre.v);
                // f1 puan tablosu
                const puanTablosu = {1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1};
                if (!isNaN(pozisyon) && puanTablosu[pozisyon]) {
                    toplamPuan += puanTablosu[pozisyon];
                    if (s < toplamYaris - 1) oncekiPuan += puanTablosu[pozisyon];
                }
            }
        }
        const takim = pilotTakimlar[pilotAdi] || 'Unknown';
        pilotVerileri.push({
            ad: pilotAdi,
            tamIsim: pilotIsimler[pilotAdi] || pilotAdi,
            takim: takim,
            puan: toplamPuan,
            oncekiPuan: oncekiPuan
        });
        if (!takimPuanlari[takim]) takimPuanlari[takim] = 0;
        takimPuanlari[takim] += toplamPuan;
    }
    console.log('buraya girdi');
    const oncekiSiralama = [...pilotVerileri]
        .sort((a, b) => b.oncekiPuan - a.oncekiPuan)
        .reduce((acc, pilot, i) => {
            acc[pilot.ad] = i + 1;
            return acc;
        }, {});
    pilotVerileri.sort((a, b) => b.puan - a.puan);
    pilotVerileri.forEach((pilot, i) => {
        pilot.oncekiPozisyon = oncekiSiralama[pilot.ad] || i + 1;
    });
    takimVerileri = Object.entries(takimPuanlari)
        .map(([takim, puan]) => ({ takim, puan }))
        .sort((a, b) => b.puan - a.puan);
    pilotlariGoster();
    takimlariGoster();
}

function pilotlariGoster(){
    const tbody = document.getElementById('driversBody');
    tbody.innerHTML = '';
    const liderPuan = pilotVerileri[0]?.puan || 0;
    pilotVerileri.forEach((pilot, i) => {
        const pozisyon = i + 1;
        const row = document.createElement('tr');
        const posCss = pozisyon <= 3 ? `p${pozisyon}` : '';
        const logo = takimLogolari[pilot.takim] || '';
        const fark = pozisyon > 1 ? liderPuan - pilot.puan : '';
        const prevPos = pilot.oncekiPozisyon || pozisyon;
        let degisim = '';
        if (prevPos < pozisyon) degisim = '<span class="pos-change down">&#9660;</span>';
        else if (prevPos > pozisyon) degisim = '<span class="pos-change up">&#9650;</span>';
        row.innerHTML = `
            <td><div class="position ${posCss}">${pozisyon} ${degisim}</div></td>
            <td>
                <div class="driver-info">
                    <div class="driver-name">${pilot.tamIsim}</div>
                    <div class="driver-username">@${pilot.ad}</div>
                </div>
            </td>
            <td>
                <div class="team-info">
                    <img src="${logo}" alt="${pilot.takim}" class="team-logo" onerror="this.style.display='none'">
                    <span class="team-name">${pilot.takim}</span>
                </div>
            </td>
            <td>
                <div class="points">
                    ${pilot.puan}
                    ${fark ? `<span class="points-gap">-${fark}</span>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function takimlariGoster(){
    const tbody = document.getElementById('teamsBody');
    tbody.innerHTML = '';
    takimVerileri.forEach((takim, i) => {
        const pozisyon = i + 1;
        const row = document.createElement('tr');
        const posCss = pozisyon <= 3 ? `p${pozisyon}` : '';
        const logo = takimLogolari[takim.takim] || '';
        row.innerHTML = `
            <td><div class="position ${posCss}">${pozisyon}</div></td>
            <td>
                <div class="team-info">
                    <img src="${logo}" alt="${takim.takim}" class="team-logo" onerror="this.style.display='none'">
                    <span class="driver-name">${takim.takim}</span>
                </div>
            </td>
            <td><div class="points">${takim.puan}</div></td>
        `;
        tbody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    verileriCek();
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
        });
    });
});

setInterval(verileriCek, 120000); // 2 dakikada bir yenile
