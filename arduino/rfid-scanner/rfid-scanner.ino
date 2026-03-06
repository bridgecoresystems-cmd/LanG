/**
 * LanG Academy — RFID Bracelet Scanner
 * ESP32 + RC522 prototype
 *
 * Reads Mifare UID from RC522 and sends it to the LanG backend.
 * The head-teacher web UI polls the backend to pick up the UID
 * and assign it to a student without typing it manually.
 *
 * ─── Wiring (ESP32 DevKit v1 ↔ RC522) ───────────────────────────────────────
 *   RC522 pin  │  ESP32 pin
 *   ───────────┼────────────
 *   SDA (SS)   │  GPIO 5
 *   SCK        │  GPIO 18
 *   MOSI       │  GPIO 23
 *   MISO       │  GPIO 19
 *   RST        │  GPIO 27
 *   GND        │  GND
 *   3.3V       │  3.3V   ← ВАЖНО: RC522 работает от 3.3V, не от 5V!
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ─── Библиотеки (установить через Arduino Library Manager) ──────────────────
 *   • MFRC522 by GithubCommunity (v1.4.x)
 *   • ArduinoJson by Benoit Blanchon (v6.x)
 * ────────────────────────────────────────────────────────────────────────────
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ─── НАСТРОЙКИ — измените под свою сеть и сервер ─────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// Адрес вашего backend (без /api/v1 — добавляется ниже)
// Пример: "http://192.168.1.100:8010"
#define SERVER_HOST      "http://192.168.1.100:8010"

// Должен совпадать с RFID_SCANNER_TOKEN на сервере (env RFID_SCANNER_TOKEN)
// или с дефолтным значением "LANG_RFID_001"
#define SCANNER_TOKEN    "LANG_RFID_001"
// ─────────────────────────────────────────────────────────────────────────────

#define SS_PIN   5
#define RST_PIN  27

MFRC522 rfid(SS_PIN, RST_PIN);

// Последний считанный UID — защита от двойного отправления
String lastSentUID = "";
unsigned long lastSentTime = 0;
const unsigned long RESEND_COOLDOWN_MS = 3000; // не отправлять один и тот же UID чаще раз в 3с

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n====== LanG RFID Scanner ======");

  // Инициализация SPI и RC522
  SPI.begin();
  rfid.PCD_Init();
  Serial.print("RC522 версия: ");
  rfid.PCD_DumpVersionToSerial();

  // Подключение к WiFi
  Serial.printf("Подключение к WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi подключён! IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("Готов к сканированию. Поднесите браслет...");
  Serial.println("================================");
}

void loop() {
  // Ждём карту
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Собираем UID в строку (HEX, без разделителей, заглавные)
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.printf("📡 Считан UID: %s\n", uid.c_str());

  // Проверяем cooldown (не отправляем один и тот же браслет дважды подряд)
  unsigned long now = millis();
  if (uid == lastSentUID && (now - lastSentTime) < RESEND_COOLDOWN_MS) {
    Serial.println("   ↳ Повтор — пропускаем");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(300);
    return;
  }

  // Отправляем на сервер
  if (WiFi.status() == WL_CONNECTED) {
    sendUidToServer(uid);
    lastSentUID = uid;
    lastSentTime = now;
  } else {
    Serial.println("❌ WiFi отключён! Переподключаемся...");
    WiFi.reconnect();
  }

  // Останавливаем карту — без этого PICC_IsNewCardPresent будет зависать
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(500); // небольшая пауза после отправки
}

void sendUidToServer(const String& uid) {
  HTTPClient http;

  String url = String(SERVER_HOST) + "/api/v1/terminal/rfid-scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 секунд таймаут

  // Собираем JSON через ArduinoJson
  StaticJsonDocument<128> doc;
  doc["scannerToken"] = SCANNER_TOKEN;
  doc["uid"] = uid;

  String payload;
  serializeJson(doc, payload);

  Serial.printf("   → POST %s\n", url.c_str());
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("   ← HTTP %d: %s\n", httpCode, response.c_str());

    if (httpCode == 200) {
      Serial.println("   ✅ Успешно отправлено!");
    } else if (httpCode == 403) {
      Serial.println("   ❌ Неверный SCANNER_TOKEN — проверьте настройки");
    }
  } else {
    Serial.printf("   ❌ Ошибка HTTP: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}
