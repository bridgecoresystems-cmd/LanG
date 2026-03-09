/**
 * LanG Academy — Payment Terminal
 * ESP32 + RC522 + LCD 2004A (I2C) + Keypad 4x4 + LEDs + Active Buzzer
 *
 * Поток:
 *  1. Ожидание браслета (STANDBY)
 *  2. Браслет приложен → проверяем баланс (BALANCE_CHECK)
 *  3. Показываем имя + баланс, вводим сумму (ENTER_AMOUNT)
 *  4. Подтверждение (CONFIRM)
 *  5. Отправляем платёж на сервер (PROCESSING)
 *  6. Успех / Ошибка → 3 секунды → возврат в STANDBY
 *
 * Клавиши на keypad:
 *   0-9  : цифры суммы
 *   #    : подтвердить / OK
 *   *    : backspace / отмена
 *   D    : сброс, вернуться в начало
 *
 * ─── Библиотеки (Library Manager) ───────────────────────────────────────────
 *   MFRC522         by GithubCommunity
 *   LiquidCrystal_I2C by Frank de Brabander (или Marco Schwartz)
 *   Keypad          by Mark Stanley, Alexander Brevig
 *   ArduinoJson     by Benoit Blanchon (v6)
 * ─────────────────────────────────────────────────────────────────────────────
 */

 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <SPI.h>
 #include <MFRC522.h>
 #include <Wire.h>
 #include <LiquidCrystal_I2C.h>
 #include <Keypad.h>
 #include <ArduinoJson.h>
 
 // ═══════════════════════════════════════════════════════════
 //  НАСТРОЙКИ — изменить под себя
 // ═══════════════════════════════════════════════════════════
 #define WIFI_SSID        "TP-LINK"
 #define WIFI_PASSWORD    "azat1987"
 
 // Адрес backend без /api/v1
 #define SERVER_HOST     "http://192.168.1.110:8010"
 
 // terminalId и authToken из таблицы gems_vendors в БД
 // (создать через /admin/terminals в веб-панели)
 #define TERMINAL_ID     "BCST-101"
 #define AUTH_TOKEN      "29b85bbf-2da8-4e3e-a994-a536f45c998c"
 
 // LCD I2C адрес — обычно 0x27 или 0x3F
 // Если не работает — запусти I2C Scanner (см. ниже)
 #define LCD_ADDR        0x27
 // ═══════════════════════════════════════════════════════════
 
 // ─── Пины ────────────────────────────────────────────────
 #define RC522_SS    5
 #define RC522_RST   4
 
 #define LED_GREEN   2
 #define LED_RED     15
 #define LED_YELLOW  16
 #define BUZZER_PIN  17
 
 // Keypad 4x4
 const byte KP_ROWS = 4;
 const byte KP_COLS = 4;
 char keys[KP_ROWS][KP_COLS] = {
   {'1','2','3','A'},
   {'4','5','6','B'},
   {'7','8','9','C'},
   {'*','0','#','D'}
 };
 byte rowPins[KP_ROWS] = {32, 33, 25, 26};
 byte colPins[KP_COLS] = {13, 12, 14, 27};
 
 // ─── Объекты ─────────────────────────────────────────────
 MFRC522 rfid(RC522_SS, RC522_RST);
 LiquidCrystal_I2C lcd(LCD_ADDR, 20, 4);
 Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, KP_ROWS, KP_COLS);
 
 // ─── Состояния ───────────────────────────────────────────
 enum State {
   STANDBY,
   BALANCE_CHECK,
   ENTER_AMOUNT,
   CONFIRM,
   PROCESSING,
   SUCCESS,
   ERROR_STATE
 };
 State state = STANDBY;
 
 // ─── Глобальные переменные ───────────────────────────────
 String currentUID     = "";
 String studentName    = "";
 int    studentBalance = 0;
 String amountStr      = "";
 String errorMsg       = "";
 unsigned long stateTimer = 0;      // для авто-сброса после SUCCESS/ERROR
 const unsigned long RESULT_SHOW_MS = 3500; // 3.5 секунды показываем результат
 
 // WiFi reconnect
 unsigned long lastWifiCheck = 0;
 const unsigned long WIFI_CHECK_INTERVAL = 10000;
 
 // ═══════════════════════════════════════════════════════════
 //  BUZZER / LED helpers
 // ═══════════════════════════════════════════════════════════
 
 void beepShort() {
   digitalWrite(BUZZER_PIN, HIGH);
   delay(80);
   digitalWrite(BUZZER_PIN, LOW);
 }
 
 void beepDouble() {
   beepShort(); delay(100); beepShort();
 }
 
 void beepLong() {
   digitalWrite(BUZZER_PIN, HIGH);
   delay(600);
   digitalWrite(BUZZER_PIN, LOW);
 }
 
 void setLED(bool green, bool red, bool yellow) {
   digitalWrite(LED_GREEN,  green  ? HIGH : LOW);
   digitalWrite(LED_RED,    red    ? HIGH : LOW);
   digitalWrite(LED_YELLOW, yellow ? HIGH : LOW);
 }
 
// ═══════════════════════════════════════════════════════════
//  LCD helpers
// ═══════════════════════════════════════════════════════════

// Исправление туркменских букв (транслитерация в ASCII для LCD)
String cleanText(String text) {
  String out = "";
  for (int i = 0; i < text.length(); i++) {
    unsigned char c = text[i];
    if (c < 128) {
      out += (char)c;
    } else {
      // Обработка UTF-8 (двухбайтовые символы)
      unsigned char next = text[i + 1];
      if (c == 0xC3) {
        if (next == 0xA4) out += 'a';      // ä
        else if (next == 0x84) out += 'A'; // Ä
        else if (next == 0xB6) out += 'o'; // ö
        else if (next == 0x96) out += 'O'; // Ö
        else if (next == 0xBC) out += 'u'; // ü
        else if (next == 0x9C) out += 'U'; // Ü
        else if (next == 0xA7) out += 'c'; // ç
        else if (next == 0x87) out += 'C'; // Ç
        else if (next == 0xBD) out += 'y'; // ý
        else if (next == 0x9D) out += 'Y'; // Ý
        else out += '?';
        i++;
      } else if (c == 0xC5) {
        if (next == 0x9F) out += 's';      // ş
        else if (next == 0x9E) out += 'S'; // Ş
        else if (next == 0xBE) out += 'z'; // ž
        else if (next == 0xBD) out += 'Z'; // Ž
        else if (next == 0x88) out += 'n'; // ň
        else if (next == 0x87) out += 'N'; // Ň
        else out += '?';
        i++;
      } else {
        out += '?';
      }
    }
  }
  return out;
}

// Вывод строки с выравниванием по центру (ширина 20)
void lcdPrintCenter(int row, const String& text) {
  String clean = cleanText(text);
  if (clean.length() > 20) clean = clean.substring(0, 20);
  int spaces = (20 - clean.length()) / 2;
  String line = "";
  for (int i = 0; i < spaces; i++) line += " ";
  line += clean;
  while (line.length() < 20) line += " ";
  lcd.setCursor(0, row);
  lcd.print(line);
}

void lcdPrint(int row, const String& text) {
  String clean = cleanText(text);
  while (clean.length() < 20) clean += " ";
  if (clean.length() > 20) clean = clean.substring(0, 20);
  lcd.setCursor(0, row);
  lcd.print(clean);
}
 
 void lcdClear() {
   for (int r = 0; r < 4; r++) lcdPrint(r, "");
 }
 
 // ═══════════════════════════════════════════════════════════
 //  ЭКРАНЫ
 // ═══════════════════════════════════════════════════════════
 
 void showStandby() {
   lcdClear();
   lcdPrintCenter(0, "== LanG Terminal ==");
   lcdPrintCenter(1, "");
   lcdPrintCenter(2, "Tap bracelet...");
   lcdPrintCenter(3, "");
   setLED(false, false, false);
 }
 
 void showChecking() {
   lcdClear();
   lcdPrintCenter(0, "Checking...");
   lcdPrintCenter(1, currentUID);
   lcdPrintCenter(2, "Please wait");
   setLED(false, false, true); // жёлтый — ожидание
 }
 
 void showEnterAmount() {
   lcdPrint(0, truncateName(studentName));
   lcdPrint(1, "Balance: " + String(studentBalance) + " gems  ");
   lcdPrint(2, "Amount: " + amountStr + "         ");
   lcdPrint(3, "# OK    * del   D cls");
 }
 
 void showConfirm() {
   lcdPrint(0, truncateName(studentName));
   lcdPrint(1, "Pay: " + amountStr + " gems   ");
   lcdPrint(2, "Remain: " + String(studentBalance - amountStr.toInt()) + " gems  ");
   lcdPrint(3, "# Confirm  * Cancel");
 }
 
 void showProcessing() {
   lcdClear();
   lcdPrintCenter(0, "Processing...");
   lcdPrintCenter(1, "Please wait");
   setLED(false, false, true);
 }
 
 void showSuccess(int newBalance) {
   lcdClear();
   lcdPrintCenter(0, "** Payment OK! **");
   lcdPrintCenter(1, "Paid: " + amountStr + " gems");
   lcdPrintCenter(2, "Remain: " + String(newBalance) + " gems");
   lcdPrintCenter(3, "Thank you!");
   setLED(true, false, false); // зелёный
   beepDouble();
 }
 
 void showError(const String& msg) {
   lcdClear();
   lcdPrintCenter(0, "*** ERROR ***");
   lcdPrintCenter(1, msg);
   lcdPrintCenter(2, "");
   lcdPrintCenter(3, "Please try again");
   setLED(false, true, false); // красный
   beepLong();
 }
 
// Обрезаем имя до 20 символов (учитывая очистку текста)
String truncateName(const String& name) {
  String clean = cleanText(name);
  if (clean.length() <= 20) return clean;
  return clean.substring(0, 17) + "...";
}
 
 // ═══════════════════════════════════════════════════════════
 //  RFID
 // ═══════════════════════════════════════════════════════════
 
 String readRfidUID() {
   if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return "";
 
   String uid = "";
   for (byte i = 0; i < rfid.uid.size; i++) {
     if (rfid.uid.uidByte[i] < 0x10) uid += "0";
     uid += String(rfid.uid.uidByte[i], HEX);
   }
   uid.toUpperCase();
 
   rfid.PICC_HaltA();
   rfid.PCD_StopCrypto1();
   return uid;
 }
 
 // ═══════════════════════════════════════════════════════════
 //  HTTP ЗАПРОСЫ
 // ═══════════════════════════════════════════════════════════
 
 // GET /terminal/balance — получить баланс по UID
 // Возвращает true при успехе, заполняет studentName и studentBalance
 bool fetchBalance(const String& uid) {
   if (WiFi.status() != WL_CONNECTED) return false;
 
   HTTPClient http;
   String url = String(SERVER_HOST) + "/api/v1/terminal/balance"
                + "?terminalId=" + TERMINAL_ID
                + "&authToken=" + AUTH_TOKEN
                + "&rfidUid=" + uid;
 
   http.begin(url);
   http.setTimeout(5000);
   int code = http.GET();
 
   if (code != 200) {
     String body = http.getString();
     http.end();
     Serial.printf("[HTTP] balance error %d: %s\n", code, body.c_str());
 
     DynamicJsonDocument err(256);
     if (!deserializeJson(err, body)) {
       errorMsg = err["message"] | "Server error";
     } else {
       errorMsg = "HTTP " + String(code);
     }
     return false;
   }
 
   String body = http.getString();
   http.end();
 
   DynamicJsonDocument doc(512);
   if (deserializeJson(doc, body)) { errorMsg = "JSON error"; return false; }
 
   studentName    = doc["studentName"] | "Unknown";
   studentBalance = doc["balance"]     | 0;
   return true;
 }
 
 // POST /terminal/payment — произвести платёж
 // Возвращает true при успехе, заполняет newBalance
 bool doPayment(const String& uid, int amount, int& newBalance) {
   if (WiFi.status() != WL_CONNECTED) { errorMsg = "No WiFi"; return false; }
 
   HTTPClient http;
   String url = String(SERVER_HOST) + "/api/v1/terminal/payment";
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   http.setTimeout(8000);
 
   DynamicJsonDocument req(256);
   req["terminalId"] = TERMINAL_ID;
   req["authToken"]  = AUTH_TOKEN;
   req["rfidUid"]    = uid;
   req["amount"]     = amount;
 
   String payload;
   serializeJson(req, payload);
   Serial.printf("[HTTP] POST payment uid=%s amount=%d\n", uid.c_str(), amount);
 
   int code = http.POST(payload);
   String body = http.getString();
   http.end();
 
   Serial.printf("[HTTP] payment response %d: %s\n", code, body.c_str());
 
   DynamicJsonDocument res(512);
   if (deserializeJson(res, body)) { errorMsg = "JSON error"; return false; }
 
   String status = res["status"] | "error";
   if (status == "success") {
     newBalance = res["newBalance"] | 0;
     return true;
   } else {
     String msg = res["message"] | "Payment failed";
     // Укорачиваем до 20 символов для LCD
     errorMsg = msg.substring(0, 20);
     return false;
   }
 }
 
 // ═══════════════════════════════════════════════════════════
 //  WiFi
 // ═══════════════════════════════════════════════════════════
 
 void ensureWifi() {
   if (WiFi.status() == WL_CONNECTED) return;
   Serial.println("[WiFi] Reconnecting...");
   lcdPrint(3, "WiFi reconnecting..");
   WiFi.reconnect();
   unsigned long t = millis();
   while (WiFi.status() != WL_CONNECTED && millis() - t < 10000) {
     delay(200);
   }
   if (WiFi.status() == WL_CONNECTED) {
     Serial.print("[WiFi] Reconnected: ");
     Serial.println(WiFi.localIP());
   }
 }
 
 // ═══════════════════════════════════════════════════════════
 //  SETUP
 // ═══════════════════════════════════════════════════════════
 
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n====== LanG Payment Terminal ======");

  // LCD — ПЕРВЫМ (как в lcd-scan.ino), до SPI/RC522
  Wire.begin(21, 22); // SDA=21, SCL=22
  delay(100);
  lcd.init();
  lcd.backlight();
  lcdPrintCenter(0, "== LanG Terminal ==");

  // Пины
  pinMode(LED_GREEN,  OUTPUT);
  pinMode(LED_RED,    OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  setLED(false, false, false);
  digitalWrite(BUZZER_PIN, LOW);
   lcdPrintCenter(1, "  Starting up...  ");
   lcdPrintCenter(2, "");
   lcdPrintCenter(3, "");
 
   // RC522
   SPI.begin();
   rfid.PCD_Init();
   Serial.print("[RC522] FW: ");
   rfid.PCD_DumpVersionToSerial();
 
   // WiFi
   lcdPrintCenter(2, "WiFi connecting...");
   Serial.printf("[WiFi] Connecting to %s\n", WIFI_SSID);
   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
   int tries = 0;
   while (WiFi.status() != WL_CONNECTED && tries < 40) {
     delay(500);
     Serial.print(".");
     tries++;
   }
   Serial.println();
 
   if (WiFi.status() == WL_CONNECTED) {
     Serial.print("[WiFi] Connected! IP: ");
     Serial.println(WiFi.localIP());
     lcdPrintCenter(2, "WiFi OK!");
     beepShort();
     setLED(true, false, false);
     delay(600);
     setLED(false, false, false);
   } else {
     Serial.println("[WiFi] FAILED!");
     lcdPrintCenter(2, "WiFi FAILED!");
     setLED(false, true, false);
     beepLong();
     delay(1000);
     setLED(false, false, false);
   }
 
   delay(600);
   showStandby();
   Serial.println("[Ready] Waiting for bracelet...");
 }
 
 // ═══════════════════════════════════════════════════════════
 //  LOOP — машина состояний
 // ═══════════════════════════════════════════════════════════
 
 void loop() {
   // Периодически проверяем WiFi
   if (millis() - lastWifiCheck > WIFI_CHECK_INTERVAL) {
     lastWifiCheck = millis();
     ensureWifi();
   }
 
   char key = keypad.getKey();
 
   switch (state) {
 
     // ─── STANDBY ──────────────────────────────────────────
     case STANDBY: {
       String uid = readRfidUID();
       if (uid.length() == 0) break;
 
       currentUID = uid;
       amountStr  = "";
       Serial.printf("[RFID] Card: %s\n", uid.c_str());
       beepShort();
       state = BALANCE_CHECK;
       showChecking();
       break;
     }
 
     // ─── BALANCE_CHECK ────────────────────────────────────
     case BALANCE_CHECK: {
       bool ok = fetchBalance(currentUID);
       if (ok) {
         Serial.printf("[Balance] %s: %d gems\n", studentName.c_str(), studentBalance);
         state = ENTER_AMOUNT;
         showEnterAmount();
       } else {
         Serial.printf("[Balance] Error: %s\n", errorMsg.c_str());
         state = ERROR_STATE;
         showError(errorMsg);
         stateTimer = millis();
       }
       break;
     }
 
     // ─── ENTER_AMOUNT ─────────────────────────────────────
     case ENTER_AMOUNT: {
       if (!key) break;
 
       if (key >= '0' && key <= '9') {
         if (amountStr.length() < 5) { // максимум 99999 gems
           amountStr += key;
           showEnterAmount();
         }
       } else if (key == '*') {
         // Backspace
         if (amountStr.length() > 0) {
           amountStr = amountStr.substring(0, amountStr.length() - 1);
           showEnterAmount();
         }
       } else if (key == '#') {
         // OK — переходим к подтверждению
         if (amountStr.length() == 0 || amountStr.toInt() <= 0) {
           lcdPrint(3, "Enter amount > 0    ");
           break;
         }
         if (amountStr.toInt() > studentBalance) {
           lcdPrint(3, "Not enough gems!    ");
           beepShort();
           break;
         }
         state = CONFIRM;
         showConfirm();
       } else if (key == 'D') {
         // Сброс → Standby
         state = STANDBY;
         showStandby();
       }
       break;
     }
 
     // ─── CONFIRM ──────────────────────────────────────────
     case CONFIRM: {
       if (!key) break;
 
       if (key == '#') {
         // Подтверждено — платим
         state = PROCESSING;
         showProcessing();
 
         int amount   = amountStr.toInt();
         int newBalance = 0;
         bool ok = doPayment(currentUID, amount, newBalance);
 
         if (ok) {
           state = SUCCESS;
           showSuccess(newBalance);
           stateTimer = millis();
           // Real-time обновление баланса студента произойдёт через WS на сервере
         } else {
           state = ERROR_STATE;
           showError(errorMsg);
           stateTimer = millis();
         }
       } else if (key == '*') {
         // Отмена → вернуться к вводу суммы
         state = ENTER_AMOUNT;
         showEnterAmount();
       } else if (key == 'D') {
         state = STANDBY;
         showStandby();
       }
       break;
     }
 
     // ─── SUCCESS ──────────────────────────────────────────
     case SUCCESS: {
       if (millis() - stateTimer > RESULT_SHOW_MS) {
         setLED(false, false, false);
         state = STANDBY;
         showStandby();
       }
       break;
     }
 
     // ─── ERROR ────────────────────────────────────────────
     case ERROR_STATE: {
       if (millis() - stateTimer > RESULT_SHOW_MS) {
         setLED(false, false, false);
         state = STANDBY;
         showStandby();
       }
       // Любая клавиша тоже сбрасывает
       if (key) {
         setLED(false, false, false);
         state = STANDBY;
         showStandby();
       }
       break;
     }
 
     default:
       break;
   }
 }
 
 // ═══════════════════════════════════════════════════════════
 //  I2C SCANNER (раскомментировать в setup() для поиска адреса LCD)
 // ═══════════════════════════════════════════════════════════
 //
 // void i2cScan() {
 //   Serial.println("I2C Scan:");
 //   for (byte addr = 1; addr < 127; addr++) {
 //     Wire.beginTransmission(addr);
 //     if (Wire.endTransmission() == 0) {
 //       Serial.printf("  Found: 0x%02X\n", addr);
 //     }
 //   }
 // }