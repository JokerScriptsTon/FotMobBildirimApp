// Telegram Web App SDK başlatma
const tg = window.Telegram.WebApp;
const GAS_URL = "/**
 * TELEGRAM FUTBOL BİLDİRİM BOTU - GOOGLE APPS SCRIPT BACKEND
 * 
 * VERSION: 1.4 - SPEED & STABILITY UPDATE
 */

const TOKEN = "8127157973:AAGc8qFFVtlgIBegjVml3Ji9ecWNpnCIBcY";
const TELEGRAM_API = "https://api.telegram.org/bot" + TOKEN;
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx90bWnv4WyuDyG9adVRWIXIPIFMay8pcLK8OtzWSgKd6EToFoiy0aJls5HtiZ34Th3-Q/exec";
const VERSION = "1.6 - Duplicate Prevention";

/**
 * ⚡ HIZLI KURULUM - Botu başlatmak için bu fonksiyonu çalıştırın
 * Bu fonksiyon webhook'u sıfırlar, yeniden kurar ve test eder
 */
function quickSetup() {
  Logger.log("🚀 Bot kurulumu başlatılıyor...\n");
  
  // 1. Webhook'u sıfırla
  Logger.log("1️⃣ Webhook sıfırlanıyor...");
  resetWebhook();
  
  // 2. Webhook bilgilerini kontrol et
  Logger.log("\n2️⃣ Webhook durumu kontrol ediliyor...");
  const info = getWebhookInfo();
  
  if (info.result.url === WEB_APP_URL) {
    Logger.log("✅ Webhook doğru URL'ye kurulu");
  } else {
    Logger.log("❌ Webhook URL'si yanlış!");
    return;
  }
  
  // 3. Test mesajı gönder
  Logger.log("\n3️⃣ Test mesajı gönderiliyor...");
  Logger.log("⚠️ Lütfen önce Telegram'da botunuza /start yazın!");
  Logger.log("⏳ 5 saniye bekleniyor...");
  Utilities.sleep(5000);
  
  testBot();
  
  Logger.log("\n✅ Kurulum tamamlandı!");
  Logger.log("📱 Telegram'da botunuza /ping yazarak test edebilirsiniz");
}


/**
 * Webhook kurulumunu yapar
 */
function setWebhook() {
  const url = TELEGRAM_API + "/setWebhook?url=" + encodeURIComponent(WEB_APP_URL) + "&drop_pending_updates=true";
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());
  Logger.log("Webhook Kurulum Sonucu: " + JSON.stringify(result));
  
  if (result.ok) {
    Logger.log("✅ Webhook başarıyla kuruldu!");
  } else {
    Logger.log("❌ Webhook kurulumu başarısız: " + result.description);
  }
  
  return result;
}

/**
 * Webhook bilgilerini kontrol eder
 */
function getWebhookInfo() {
  const url = TELEGRAM_API + "/getWebhookInfo";
  const response = UrlFetchApp.fetch(url);
  const info = JSON.parse(response.getContentText());
  Logger.log("Webhook Bilgileri: " + JSON.stringify(info, null, 2));
  return info;
}

/**
 * Webhook'u siler ve yeniden kurar (sorun giderme için)
 */
function resetWebhook() {
  // Önce webhook'u sil
  const deleteUrl = TELEGRAM_API + "/deleteWebhook?drop_pending_updates=true";
  UrlFetchApp.fetch(deleteUrl);
  Logger.log("Webhook silindi");
  
  // Script Properties'i temizle
  PropertiesService.getScriptProperties().deleteProperty("last_update_id");
  Logger.log("Update ID cache temizlendi");
  
  // 2 saniye bekle
  Utilities.sleep(2000);
  
  // Yeniden kur
  return setWebhook();
}

/**
 * Bot'u test et - Kendinize direkt mesaj gönderir
 * KULLANIM: Bu fonksiyonu çalıştırmadan önce, Telegram'da botunuza /start yazın
 */
function testBot() {
  // Önce webhook durumunu kontrol et
  const webhookInfo = getWebhookInfo();
  
  if (!webhookInfo.result.url) {
    Logger.log("❌ HATA: Webhook kurulu değil!");
    Logger.log("👉 Çözüm: setWebhook() fonksiyonunu çalıştırın");
    return;
  }
  
  if (webhookInfo.result.pending_update_count > 0) {
    Logger.log("⚠️ UYARI: " + webhookInfo.result.pending_update_count + " bekleyen güncelleme var");
    Logger.log("👉 Çözüm: resetWebhook() fonksiyonunu çalıştırın");
  }
  
  if (webhookInfo.result.last_error_message) {
    Logger.log("❌ Son Hata: " + webhookInfo.result.last_error_message);
    Logger.log("❌ Hata Zamanı: " + new Date(webhookInfo.result.last_error_date * 1000));
  }
  
  // Test mesajı gönder
  Logger.log("\n📤 Test mesajı gönderiliyor...");
  Logger.log("ℹ️ Lütfen Telegram'da botunuza /start yazmış olduğunuzdan emin olun");
  
  // getUpdates ile son mesajları al (chat_id bulmak için)
  const updatesUrl = TELEGRAM_API + "/getUpdates?limit=1";
  const updatesResponse = UrlFetchApp.fetch(updatesUrl);
  const updates = JSON.parse(updatesResponse.getContentText());
  
  if (updates.result && updates.result.length > 0) {
    const chatId = updates.result[0].message.chat.id;
    Logger.log("✅ Chat ID bulundu: " + chatId);
    
    const testResult = sendTelegramMessage(chatId, "🧪 <b>Test Mesajı</b>\n\nBot çalışıyor! ✅\n\nVersion: " + VERSION);
    
    if (testResult) {
      Logger.log("✅ Test mesajı başarıyla gönderildi!");
      Logger.log("📱 Telegram'ı kontrol edin");
    } else {
      Logger.log("❌ Test mesajı gönderilemedi");
    }
  } else {
    Logger.log("❌ Chat ID bulunamadı");
    Logger.log("👉 Lütfen önce Telegram'da botunuza /start yazın");
  }
}

/**
 * Telegram'dan gelen mesajları karşılar
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return ContentService.createTextOutput("no-data");

    const contents = JSON.parse(e.postData.contents);
    
    // Update ID kontrolü - aynı mesajın tekrar işlenmesini engeller
    if (contents.update_id) {
      const scriptProps = PropertiesService.getScriptProperties();
      const lastUpdateId = scriptProps.getProperty("last_update_id");
      
      // Eğer bu update_id daha önce işlendiyse, tekrar işleme
      if (lastUpdateId && parseInt(lastUpdateId) >= contents.update_id) {
        console.log("Duplicate update ignored: " + contents.update_id);
        return ContentService.createTextOutput("ok");
      }
      
      // Son işlenen update_id'yi kaydet
      scriptProps.setProperty("last_update_id", contents.update_id.toString());
    }
    
    console.log("İstek Alındı: " + JSON.stringify(contents));
    
    if (contents.message) {
      handleTelegramMessage(contents.message);
    } else if (contents.userId) {
      handleUserPreferences(contents);
    }
    
    // Telegram'a en hızlı şekilde 200 OK dönüyoruz. 
    // MimeType.TEXT genellikle JSON'dan daha hızlı işlenir.
    return ContentService.createTextOutput("ok");
      
  } catch (err) {
    console.error("Kritik Hata: " + err.toString());
    return ContentService.createTextOutput("error");
  }
}

/**
 * Mesaj işleme mantığı
 */
function handleTelegramMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim().toLowerCase();
  
  if (text.startsWith("/start")) {
    const welcomeText = "⚽ Futbol Bildirim Botuna Hoş Geldiniz!\n\nTakımınızı seçmek ve bildirim ayarlarını yapmak için aşağıdaki butona tıklayın.";
    const keyboard = {
      inline_keyboard: [[
        { text: "Uygulamayı Aç", web_app: { url: "https://jokerscriptston.github.io/FotMobBildirimApp/" } }
      ]]
    };
    sendTelegramMessage(chatId, welcomeText, keyboard);
  } else if (text.startsWith("/ping")) {
    sendTelegramMessage(chatId, "Pong! Bot aktif ve cevap veriyor. ✅ (v" + VERSION + ")");
  }
}

/**
 * Mesaj gönderme - UrlFetchApp kullanarak
 */
function sendTelegramMessage(chatId, text, keyboard) {
  const url = TELEGRAM_API + "/sendMessage";
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };
  
  // Keyboard varsa ekle
  if (keyboard) {
    payload.reply_markup = keyboard;
  }
  
  try {
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      console.error("Telegram API Hatası: " + responseCode + " - " + responseText);
      return false;
    }
    
    console.log("Mesaj başarıyla gönderildi: " + chatId);
    return true;
    
  } catch (e) {
    console.error("Gönderme Hatası: " + e.toString());
    return false;
  }
}

/**
 * Tablo işlemleri
 */
function handleUserPreferences(data) {
  const sheetId = getSheetId();
  if (!sheetId) return;
  
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Kullanicilar") || createSheet();
  const rows = sheet.getDataRange().getValues();
  let userRowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.userId) {
      userRowIndex = i + 1;
      break;
    }
  }
  
  const newRow = [data.userId, data.username, data.team.name, data.team.id, data.notifGoal, data.notifCard, data.notifHalf, data.notifFinish, new Date()];
  
  if (userRowIndex > -1) {
    sheet.getRange(userRowIndex, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }
}

function getSheetId() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet().getId();
  } catch (e) {
    console.error("Spreadsheet ID Bulunamadı");
    return null;
  }
}

function createSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet("Kullanicilar");
  sheet.appendRow(["User ID", "Username", "Takım", "Takım ID", "Gol", "Kart", "Devre", "Bitiş", "Son Güncelleme"]);
  return sheet;
}

function doGet() {
  return ContentService.createTextOutput("Bot Aktif! (v" + VERSION + ")");
}

function showMyUrl() {
  const url = ScriptApp.getService().getUrl();
  console.log("Web App URL'niz: " + url);
  return url;
}
";
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



