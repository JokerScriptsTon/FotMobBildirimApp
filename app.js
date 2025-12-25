// Telegram Web App SDK başlatma
const tg = window.Telegram.WebApp;
const GAS_URL = "https://script.google.com/macros/s/AKfycbx90bWnv4WyuDyG9adVRWIXIPIFMay8pcLK8OtzWSgKd6EToFoiy0aJls5HtiZ34Th3-Q/exec";
tg.expand(); // Uygulamayı tam ekran yap

// Elementleri seçme
const teamList = document.getElementById('team-list');
const teamSearch = document.getElementById('team-search');
const selectionSection = document.getElementById('selection-section');
const preferencesSection = document.getElementById('preferences-section');
const selectedTeamNameDisplay = document.getElementById('selected-team-name');
const backBtn = document.getElementById('back-btn');
const saveBtn = document.getElementById('save-btn');
const userNameDisplay = document.getElementById('user-name');

// Örnek Takım Verileri (Gerçek API gelene kadar)
const teams = [
    { id: 1, name: "Galatasaray" },
    { id: 2, name: "Fenerbahçe" },
    { id: 3, name: "Beşiktaş" },
    { id: 4, name: "Trabzonspor" },
    { id: 5, name: "Real Madrid" },
    { id: 6, name: "Barcelona" },
    { id: 7, name: "Manchester City" },
    { id: 8, name: "Liverpool" }
];

let selectedTeam = null;

// Kullanıcı bilgisini göster
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userNameDisplay.textContent = `Merhaba, ${tg.initDataUnsafe.user.first_name}!`;
} else {
    userNameDisplay.textContent = "Merhaba Futbolsever!";
}

// Takımları listele
function renderTeams(filter = "") {
    teamList.innerHTML = "";
    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

    filteredTeams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<span>${team.name}</span>`;
        card.onclick = () => selectTeam(team);
        teamList.appendChild(card);
    });
}

// Takım seçme işlemi
function selectTeam(team) {
    selectedTeam = team;
    selectedTeamNameDisplay.textContent = `${team.name} Ayarları`;
    selectionSection.classList.add('hidden');
    preferencesSection.classList.remove('hidden');
    tg.MainButton.setText("AYARLARI KAYDET");
    tg.MainButton.show();
}

// Geri dön
backBtn.onclick = () => {
    selectedTeam = null;
    preferencesSection.classList.add('hidden');
    selectionSection.classList.remove('hidden');
    tg.MainButton.hide();
};

// Arama kutusu
teamSearch.oninput = (e) => {
    renderTeams(e.target.value);
};

// Kaydetme işlemi
async function handleSave() {
    const preferences = {
        userId: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : "test_user",
        username: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : "guest",
        team: selectedTeam,
        notifGoal: document.querySelector('input[name="notif-goal"]').checked,
        notifCard: document.querySelector('input[name="notif-card"]').checked,
        notifHalf: document.querySelector('input[name="notif-half"]').checked,
        notifFinish: document.querySelector('input[name="notif-finish"]').checked
    };

    tg.showConfirm(`${selectedTeam.name} bildirim ayarları kaydedilsin mi?`, async (confirmed) => {
        if (confirmed) {
            tg.MainButton.showProgress();
            try {
                const response = await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Apps Script için no-cors gerekebilir
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(preferences)
                });

                tg.showAlert("Başarıyla kaydedildi! Maç anlarında size bildirim göndereceğiz.");
                tg.close();
            } catch (error) {
                console.error("Hata:", error);
                tg.showAlert("Bir hata oluştu. Lütfen tekrar deneyin.");
            } finally {
                tg.MainButton.hideProgress();
            }
        }
    });
}

saveBtn.onclick = handleSave;
tg.onEvent('mainButtonClicked', handleSave);

// İlk yükleme
renderTeams();

// Uygulama hazır
tg.ready();


