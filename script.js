const SHEET_ID = '1hP9NKLSjiJX2tWKQOeDNIGLH8q5q_q1CevSL08oY1n4';
const GID = '920446674';
const TEAMS_GID = '1303522310';
const NAMES_GID = '1391237604';

const POINTS_SYSTEM = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1
};

// Takım logoları (yerel dosyalardan)
const TEAM_LOGOS = {
    'RedBull': 'Red_Bull_logo_PNG10.png',
    'Ferrari': 'ferrari.png',
    'Mercedes': 'mercedes.png',
    'McLaren': 'mclaren.png',
    'Aston Martin': 'astonmartin.png',
    'Alpine': 'alpine.png',
    'Williams': 'williams.png',
    'Racing Bulls': 'rbvisacashapp.png',
    'Kick Sauber': 'kicksauber.svg',
    'Haas': 'haas.png'
};

let DRIVER_TEAMS = {};
let DRIVER_NAMES = {};

function getSheetURL(gid) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
}

let driversData = [];
let teamsData = [];

async function fetchData() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    loading.style.display = 'block';
    error.style.display = 'none';

    try {
        // İsim verilerini çek
        const namesResponse = await fetch(getSheetURL(NAMES_GID));
        const namesText = await namesResponse.text();
        const namesJsonString = namesText.substring(47).slice(0, -2);
        const namesData = JSON.parse(namesJsonString);
        
        // Kullanıcı adı - İsim Soyisim eşleştirmesi
        if (namesData.table.rows) {
            namesData.table.rows.forEach((row, index) => {
                if (index === 0 || !row.c) return; // Başlık satırını atla
                const firstName = row.c[0] && row.c[0].v;
                const lastName = row.c[1] && row.c[1].v;
                const username = row.c[2] && row.c[2].v;
                if (username && firstName && lastName) {
                    DRIVER_NAMES[username] = `${firstName} ${lastName}`;
                }
            });
        }

        // Takım verilerini çek
        const teamsResponse = await fetch(getSheetURL(TEAMS_GID));
        const teamsText = await teamsResponse.text();
        const teamsJsonString = teamsText.substring(47).slice(0, -2);
        const teamsData = JSON.parse(teamsJsonString);
        
        // Pilot-Takım eşleştirmesini oluştur
        if (teamsData.table.rows) {
            teamsData.table.rows.forEach(row => {
                if (row.c && row.c[1] && row.c[2]) {
                    const driver = row.c[1].v;
                    const team = row.c[2].v;
                    if (driver && team) {
                        DRIVER_TEAMS[driver] = team;
                    }
                }
            });
        }

        // Yarış verilerini çek
        const response = await fetch(getSheetURL(GID));
        const text = await response.text();
        const jsonString = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonString);
        
        processData(data);
        loading.style.display = 'none';
    } catch (err) {
        console.error('Veri çekme hatası:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

function processData(data) {
    const cols = data.table.cols;
    const rows = data.table.rows;
    
    if (!cols || !rows) {
        document.getElementById('error').style.display = 'block';
        return;
    }

    driversData = [];
    const teamPoints = {};
    
    for (let colIndex = 0; colIndex < cols.length; colIndex++) {
        const driverName = cols[colIndex].label;
        if (!driverName) continue;
        
        // GP sütununu atla (DRIVER_TEAMS'de olmayan)
        if (!DRIVER_TEAMS[driverName]) continue;
        
        let totalPoints = 0;
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            if (!row || !row.c || !row.c[colIndex]) continue;
            
            const cell = row.c[colIndex];
            if (cell && cell.v !== null && cell.v !== undefined) {
                const position = parseInt(cell.v);
                if (!isNaN(position) && POINTS_SYSTEM[position]) {
                    totalPoints += POINTS_SYSTEM[position];
                }
            }
        }
        
        const team = DRIVER_TEAMS[driverName];
        
        driversData.push({
            name: driverName,
            fullName: DRIVER_NAMES[driverName] || driverName,
            team: team,
            points: totalPoints
        });

        if (!teamPoints[team]) {
            teamPoints[team] = 0;
        }
        teamPoints[team] += totalPoints;
    }

    driversData.sort((a, b) => b.points - a.points);

    teamsData = Object.entries(teamPoints).map(([team, points]) => ({
        team,
        points
    })).sort((a, b) => b.points - a.points);

    renderDrivers();
    renderTeams();
}

function renderDrivers() {
    const tbody = document.getElementById('driversBody');
    tbody.innerHTML = '';

    driversData.forEach((driver, index) => {
        const position = index + 1;
        const row = document.createElement('tr');
        const posClass = position <= 3 ? `p${position}` : '';
        const logoUrl = TEAM_LOGOS[driver.team] || '';
        
        row.innerHTML = `
            <td><div class="position ${posClass}">${position}</div></td>
            <td>
                <div class="driver-info">
                    <div class="driver-name">${driver.fullName}</div>
                    <div class="driver-username">@${driver.name}</div>
                </div>
            </td>
            <td>
                <div class="team-info">
                    <img src="${logoUrl}" alt="${driver.team}" class="team-logo" onerror="this.style.display='none'">
                    <span class="team-name">${driver.team}</span>
                </div>
            </td>
            <td><div class="points">${driver.points}</div></td>
        `;

        tbody.appendChild(row);
    });
}

function renderTeams() {
    const tbody = document.getElementById('teamsBody');
    tbody.innerHTML = '';

    teamsData.forEach((team, index) => {
        const position = index + 1;
        const row = document.createElement('tr');
        const posClass = position <= 3 ? `p${position}` : '';
        const logoUrl = TEAM_LOGOS[team.team] || '';
        
        row.innerHTML = `
            <td><div class="position ${posClass}">${position}</div></td>
            <td>
                <div class="team-info">
                    <img src="${logoUrl}" alt="${team.team}" class="team-logo" onerror="this.style.display='none'">
                    <span class="driver-name">${team.team}</span>
                </div>
            </td>
            <td><div class="points">${team.points}</div></td>
        `;

        tbody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

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

setInterval(fetchData, 120000);
