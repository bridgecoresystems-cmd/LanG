# LanG Academy — Payment Terminal

**ESP32 + RC522 + LCD 2004A + Keypad 4×4 + LEDs + Buzzer**

---

## Компоненты

| # | Компонент | Кол-во | Примечание |
|---|-----------|--------|------------|
| 1 | ESP32 DevKit v1 | 1 | + terminal/expansion board |
| 2 | RC522 RFID reader | 1 | Mifare 13.56 MHz |
| 3 | LCD 2004A (20×4) | 1 | С I2C backpack (PCF8574) |
| 4 | Keypad 4×4 | 1 | Мембранная клавиатура |
| 5 | Блок питания 5V 2A | 1 | С круглым разъёмом |
| 6 | Гнездо для БП (barrel jack female) | 1 | 5.5×2.1 мм |
| 7 | Logic Level Converter | 1 | Двунаправленный 3.3V ↔ 5V |
| 8 | Active Buzzer 5V | 1 | Активный (не пищалка, а зуммер) |
| 9 | Транзистор NPN (2N2222 или BC547) | 1 | Для управления buzzer |
| 10 | Резистор 1 кОм | 1 | База транзистора |
| 11 | Резистор 220 Ом | 3 | По одному на каждый LED |
| 12 | LED зелёный | 1 | Успешная оплата |
| 13 | LED красный | 1 | Ошибка |
| 14 | LED жёлтый | 1 | Ожидание / обработка |
| 15 | Провода Dupont (папа-папа, мама-папа) | много | Для соединений |

---

## Назначение пинов ESP32

| GPIO | Что подключено | Направление |
|------|----------------|-------------|
| GPIO 5 | RC522 SDA (SS/CS) | OUT |
| GPIO 18 | RC522 SCK | OUT |
| GPIO 23 | RC522 MOSI | OUT |
| GPIO 19 | RC522 MISO | IN |
| GPIO 4 | RC522 RST | OUT |
| GPIO 21 | LCD SDA (через Level Converter) | I2C |
| GPIO 22 | LCD SCL (через Level Converter) | I2C |
| GPIO 32 | Keypad Row 1 | OUT |
| GPIO 33 | Keypad Row 2 | OUT |
| GPIO 25 | Keypad Row 3 | OUT |
| GPIO 26 | Keypad Row 4 | OUT |
| GPIO 13 | Keypad Col 1 | IN |
| GPIO 12 | Keypad Col 2 | IN |
| GPIO 14 | Keypad Col 3 | IN |
| GPIO 27 | Keypad Col 4 | IN |
| GPIO 2 | LED зелёный (через 220 Ом) | OUT |
| GPIO 15 | LED красный (через 220 Ом) | OUT |
| GPIO 16 | LED жёлтый (через 220 Ом) | OUT |
| GPIO 17 | Buzzer (через транзистор) | OUT |
| VIN (5V) | + блока питания | POWER |
| 3.3V | RC522 VCC, Level Converter LV | POWER |
| GND | Общая земля | GND |

---

## Схема питания

```
╔═══════════════════════════════════════╗
║       БЛОК ПИТАНИЯ 5V 2A             ║
║                                       ║
║  (+) ─────────────────────────────── ║ ──→ ESP32 VIN
║                                ├──── ║ ──→ LCD VCC (5V)
║                                ├──── ║ ──→ Level Converter HV (5V)
║                                └──── ║ ──→ Buzzer (+) через схему
║  (-) ─────────────────────────────── ║ ──→ GND (общая земля)
╚═══════════════════════════════════════╝

ESP32 3.3V ──→ RC522 VCC
           ──→ Level Converter LV (3.3V)

! ВАЖНО: RC522 работает строго от 3.3V. Подключение к 5V сожжёт модуль!
```

---

## Схема RC522

```
RC522          ESP32
┌─────────┐
│ SDA(SS) │──────── GPIO 5
│ SCK     │──────── GPIO 18
│ MOSI    │──────── GPIO 23
│ MISO    │──────── GPIO 19
│ RST     │──────── GPIO 4
│ GND     │──────── GND
│ 3.3V    │──────── 3.3V  ← НЕ 5V!
│ IRQ     │  (не подключать)
└─────────┘
```

---

## Схема LCD 2004A через Level Converter

```
ESP32 (3.3V)     Level Converter       LCD 2004A (5V)
                ┌─────────────────┐
  3.3V ─────→  │ LV              │
  5V ───────→  │          HV     │ ←── 5V (от БП)
  GND ───────→ │ GND      GND   │ ←── GND
               │                 │
GPIO 21 ──────→│ LV1      HV1  │ ──────→ SDA  (LCD)
GPIO 22 ──────→│ LV2      HV2  │ ──────→ SCL  (LCD)
               └─────────────────┘
                                          VCC  ←── 5V (от БП)
                                          GND  ←── GND

! Если LCD I2C адрес неизвестен — раскомментируй i2cScan() в setup()
! Обычно адрес: 0x27 или 0x3F
```

---

## Схема Keypad 4×4

```
Keypad          ESP32
┌───────────────────────────────────────┐
│  Раскладка клавиш:                    │
│  [ 1 ][ 2 ][ 3 ][ A ]                │
│  [ 4 ][ 5 ][ 6 ][ B ]                │
│  [ 7 ][ 8 ][ 9 ][ C ]                │
│  [ * ][ 0 ][ # ][ D ]                │
└───────────────────────────────────────┘

Кабель keypad (8 проводов, слева направо):
  Провод 1 (Row 1) ──── GPIO 32
  Провод 2 (Row 2) ──── GPIO 33
  Провод 3 (Row 3) ──── GPIO 25
  Провод 4 (Row 4) ──── GPIO 26
  Провод 5 (Col 1) ──── GPIO 13
  Провод 6 (Col 2) ──── GPIO 12
  Провод 7 (Col 3) ──── GPIO 14
  Провод 8 (Col 4) ──── GPIO 27

! Если клавиши срабатывают неправильно — поменяй местами rows и cols в коде.
```

---

## Схема LEDs

```
ESP32 GPIO 2  ──── [220 Ом] ──── LED зелёный (+) ──── GND
ESP32 GPIO 15 ──── [220 Ом] ──── LED красный  (+) ──── GND
ESP32 GPIO 16 ──── [220 Ом] ──── LED жёлтый   (+) ──── GND

                  ┌─── Анод (+)  длинная ножка
LED               │
                  └─── Катод (-) короткая ножка → GND

Расчёт резистора:
  R = (V_gpio - V_led) / I
  R = (3.3V - 2.0V) / 0.010A = 130 Ом → берём 220 Ом (безопасно)
```

---

## Схема Buzzer (через транзистор)

```
ESP32 GPIO 17 ──── [1 кОм] ──── База  (B) ─┐
                                             │  Транзистор NPN
                              Эмиттер (E) ──┤── GND
                               Коллектор (C)─┘
                                    │
                               Buzzer (-)
                               Buzzer (+) ──── 5V (от БП)

Цоколёвка 2N2222 (вид снизу, плоской стороной к себе):
  Левый  пин → Эмиттер (E) → GND
  Средний пин → База (B)    → через 1 кОм к GPIO 17
  Правый пин → Коллектор (C)→ Buzzer (-)

Цоколёвка BC547 (вид спереди, плоской стороной к себе):
  Левый  пин → Коллектор (C) → Buzzer (-)
  Средний пин → База (B)     → через 1 кОм к GPIO 17
  Правый пин → Эмиттер (E)  → GND

! Активный buzzer имеет два провода:
  Красный / + → 5V
  Чёрный / -  → Коллектор транзистора
! Если не знаешь активный или пассивный — подай 5V напрямую:
  активный сразу пищит, пассивный молчит.
```

---

## Общая монтажная схема (ASCII)

```
                    ┌──────────────────────┐
                    │       ESP32          │
                    │                      │
 RC522 SDA ─────── │ GPIO5           GPIO2 │──220Ом── LED GREEN
 RC522 SCK ─────── │ GPIO18         GPIO15 │──220Ом── LED RED
 RC522 MOSI ────── │ GPIO23         GPIO16 │──220Ом── LED YELLOW
 RC522 MISO ────── │ GPIO19         GPIO17 │──1kOm──[NPN]── BUZZER
 RC522 RST ─────── │ GPIO4               │
                    │                      │
 LCD SDA (LvConv) ─│ GPIO21 (SDA)  GPIO32 │── Keypad Row1
 LCD SCL (LvConv) ─│ GPIO22 (SCL)  GPIO33 │── Keypad Row2
                    │               GPIO25 │── Keypad Row3
                    │               GPIO26 │── Keypad Row4
                    │               GPIO13 │── Keypad Col1
                    │               GPIO12 │── Keypad Col2
                    │               GPIO14 │── Keypad Col3
                    │               GPIO27 │── Keypad Col4
                    │                      │
 PSU 5V ────────── │ VIN            3.3V  │── RC522 VCC
 GND ─────────────│ GND             3.3V  │── LvConv LV
                    └──────────────────────┘
```

---

## Установка Arduino IDE и настройка ESP32

### 1. Добавить поддержку ESP32

В Arduino IDE → **File → Preferences → Additional boards manager URLs:**
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Затем **Tools → Board → Boards Manager** → найти `esp32` → Install.

### 2. Выбрать плату

**Tools → Board → ESP32 Arduino → ESP32 Dev Module**

### 3. Настройки порта

```
Upload Speed: 921600
CPU Frequency: 240MHz
Flash Size: 4MB
Partition Scheme: Default 4MB
Port: COM___ (Windows) или /dev/ttyUSB0 (Linux)
```

---

## Установка библиотек

**Sketch → Include Library → Manage Libraries...**

| Библиотека | Автор | Поиск |
|------------|-------|-------|
| MFRC522 | GithubCommunity | `MFRC522` |
| LiquidCrystal I2C | Frank de Brabander | `LiquidCrystal I2C` |
| Keypad | Mark Stanley | `Keypad` |
| ArduinoJson | Benoit Blanchon | `ArduinoJson` |

> **ArduinoJson** — устанавливай версию **6.x**, не 7.x.

---

## Настройка скетча (terminal.ino)

Открой файл и измени эти строки вверху:

```cpp
// WiFi
#define WIFI_SSID       "Название_вашей_сети"
#define WIFI_PASSWORD   "Пароль_WiFi"

// Адрес backend (IP сервера в локальной сети)
// Узнать IP: на сервере запусти команду ip addr | grep 192.168
#define SERVER_HOST     "http://192.168.1.100:8010"

// terminalId и authToken — берёшь из /admin/terminals в веб-панели
// Сначала создай терминал там, потом скопируй значения сюда
#define TERMINAL_ID     "TERM_001"
#define AUTH_TOKEN      "your_auth_token_here"

// I2C адрес LCD (обычно 0x27 или 0x3F)
#define LCD_ADDR        0x27
```

---

## Как найти I2C адрес LCD

Если LCD не работает — нужно найти адрес. Раскомментируй в `setup()`:

```cpp
void setup() {
  Wire.begin(21, 22);
  i2cScan();  // ← раскомментируй эту строку
  // ... остальной код ...
}
```

Открой **Serial Monitor** (115200 baud) — увидишь:
```
I2C Scan:
  Found: 0x27
```

Запиши адрес, верни в `#define LCD_ADDR` и закомментируй `i2cScan()` обратно.

---

## Как создать терминал в системе

1. Войди в `/admin/terminals` в веб-панели
2. Нажми **Добавить терминал**
3. Укажи:
   - Название: `Столовая` (или любое)
   - Terminal ID: `TERM_001`
   - Auth Token: придумай случайную строку, например `t0k3n_abc123`
   - Привяжи к пользователю-вендору (MERCHANT)
4. Скопируй `terminalId` и `authToken` в скетч

---

## Поведение терминала

### Экран в режиме ожидания
```
== LanG Terminal ==

   Tap bracelet...

```

### Экран ввода суммы
```
Батыр Акмурадов
Balance: 150 gems
Amount: 5_
# OK    * del   D cls
```

### Экран подтверждения
```
Батыр Акмурадов
Pay: 5 gems
Remain: 145 gems
# Confirm  * Cancel
```

### Экран успешной оплаты (3.5 сек)
```
** Payment OK! **
Paid: 5 gems
Remain: 145 gems
    Thank you!
```
🟢 LED зелёный + **два коротких бипа**

### Экран ошибки (3.5 сек)
```
*** ERROR ***
Insufficient gems

  Please try again
```
🔴 LED красный + **один длинный бип**

---

## Управление keypad во время оплаты

| Клавиша | Действие |
|---------|----------|
| `1` – `9`, `0` | Ввод цифр суммы (макс. 5 знаков) |
| `#` | ОК / Подтвердить |
| `*` | Удалить последнюю цифру / Отмена |
| `D` | Полный сброс → вернуться в начало |

---

## Сигналы LED и Buzzer

| Ситуация | LED | Buzzer |
|----------|-----|--------|
| Старт, WiFi OK | Зелёный (0.6 сек) | Один короткий |
| Старт, WiFi нет | Красный | Один длинный |
| Браслет считан | — | Один короткий |
| Ожидание ответа сервера | Жёлтый | — |
| Оплата успешна | Зелёный (3.5 сек) | Два коротких |
| Ошибка | Красный (3.5 сек) | Один длинный (600 мс) |

---

## Troubleshooting

### LCD не отображает ничего
- Проверь питание LCD (5V на VCC)
- Подстрой контрастность: на I2C backpack есть синий потенциометр — покрути отвёрткой
- Проверь I2C адрес через `i2cScan()`
- Убедись, что Level Converter правильно подключён (LV к 3.3V, HV к 5V)

### RC522 не читает карты
- Убедись, что питание строго 3.3V (не 5V!)
- Проверь пины SPI (5, 18, 23, 19, 4)
- Открой Serial Monitor — должна распечататься версия прошивки RC522

### Keypad срабатывает неправильно
- Поменяй местами массивы `rowPins` и `colPins` в коде
- Проверь порядок проводов от keypad (обычно 4 ряда слева, 4 колонки справа)

### ESP32 не заливается (Upload failed)
- Зажми кнопку **BOOT** на ESP32 в момент начала загрузки
- Проверь выбранный COM порт
- Уменьши Upload Speed до 115200

### WiFi не подключается
- Убедись что сеть 2.4 GHz (ESP32 не поддерживает 5 GHz)
- Проверь SSID и пароль (чувствительно к регистру)

### Сервер не отвечает (HTTP ошибка)
- Проверь `SERVER_HOST` — должен быть IP адрес сервера, не домен
- Убедись что ESP32 и сервер в одной WiFi сети
- Проверь что backend запущен: `bun run dev:backend`

---

## Файловая структура

```
arduino/
├── rfid-scanner/
│   └── rfid-scanner.ino   ← для завуча: регистрация браслетов
└── terminal/
    ├── terminal.ino        ← этот файл: оплата в кафе/магазине
    └── README.md           ← эта документация
```

---

## Связанные файлы в проекте

| Файл | Описание |
|------|----------|
| `packages/backend/src/routes/terminal.ts` | Backend API для терминала |
| `packages/frontend/pages/admin/terminals/` | Управление терминалами в веб-панели |
| `packages/backend/src/db/schema.ts` | Таблица `gems_vendors` |

---

*LanG Academy © BridgeCore SYSTEMS*
