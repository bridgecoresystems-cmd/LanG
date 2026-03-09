/**
 * LanG Terminal — LCD Address Finder
 * Минимальный скетч: только ESP32 + LCD (через Level Converter)
 * Подключи только: ESP32, Level Converter, LCD. Ни RC522, ни Keypad.
 * Цель: найти правильный I2C адрес LCD и проверить вывод.
 */
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SDA_PIN 21
#define SCL_PIN 22

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n===== LCD I2C Scanner =====");

  Wire.begin(SDA_PIN, SCL_PIN);
  delay(100);

  // Сканируем I2C
  Serial.println("I2C Scan:");
  byte found = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  Found: 0x%02X\n", addr);
      found++;
    }
    delay(5);
  }
  if (found == 0) {
    Serial.println("  Nothing found! Check wiring (SDA=21, SCL=22)");
  }

  // Пробуем LCD на 0x27 и 0x3F
  for (int addr : {0x27, 0x3F}) {
    LiquidCrystal_I2C lcd(addr, 20, 4);
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("LCD test OK!");
    lcd.setCursor(0, 1);
    lcd.print("Addr: 0x");
    lcd.print(addr, HEX);
    lcd.setCursor(0, 2);
    lcd.print("LanG Terminal");
    lcd.setCursor(0, 3);
    lcd.print("If you see this = OK");
    Serial.printf("LCD 0x%02X: text printed (check screen)\n", addr);
    delay(3000);
    lcd.clear();
  }

  Serial.println("Done. Check LCD - if text appeared, use that address in terminal.ino");
}

void loop() {
  // Ждём — ничего не делаем
  delay(5000);
}
