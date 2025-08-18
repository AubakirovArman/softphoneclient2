# Softphone Governor UI

Веб‑панель для управления конфигурациями softphone и отправки команд/запросов к сервису softphone.

## Возможности
- Управление конфигами (создание/редактирование/удаление) на вкладке "Configs".
- Управление звонками на вкладке "Softphone Control":
  - Команды: say, hangUp, clearQueue, dtmf, transfer, setConfig, removeConfig.
- Узкоспециализированные эндпоинты на вкладке "Special Endpoints":
  - GET /status?config_id=...
  - GET /clear_queue?config_id=...
  - GET /list_audio?config_id=...
  - POST /audio?config_id=...&file_name=...
  - DELETE /audio?config_id=...
  - GET /get_audio?config_id=...&file_name=...
  - POST /reload_sips?filter=...
  - GET /current_calls
- Просмотр логов на вкладке "Logs".

## Требования
- Node.js 18+
- npm (или pnpm/yarn/bun)

## Установка и запуск
```bash
cd governor
npm install
npm run dev
```
Откройте http://localhost:3000 в браузере.

## Начальная настройка
В верхней части главной страницы задайте:
- Softphone URL: адрес вашего softphone (например, http://SOFTPHONE_IP:8080)
- Secret (опционально): строка секрета, если софтфон требует секрет в query (?secret=...)
Нажмите "Save". Дальше secret будет автоматически добавляться ко всем вызовам.

## Вкладки интерфейса
1) Configs
- Создание/редактирование/удаление локальных конфигов.
- Эти конфиги используются при отправке команд и в выпадающем списке config_id в "Special Endpoints".

2) Softphone Control
- Отправка команд на корневой POST / softphone:
  - say, hangUp, clearQueue, dtmf, transfer, setConfig, removeConfig
- Типы команд соответствуют OpenAPI (см. softphone-api.yaml). Все payload’ы содержат поле type.

3) Special Endpoints
- Быстрые кнопки и формы для:
  - /status — выводит HTML‑статус выбранного конфига
  - /clear_queue — очищает очередь исходящих
  - /list_audio — список файлов из аудио‑хранилища
  - /audio (POST) — загрузка WAV (application/octet-stream)
  - /audio (DELETE) — удалить все аудио у конфига
  - /get_audio — скачать WAV по имени
  - /reload_sips (POST) — перечитать/перерегистрировать SIP‑конфиги (с опциональным filter)
  - /current_calls — объект с количеством активных звонков на конфиг
- Secret и остальные query‑параметры формируются автоматически на клиенте.

4) Logs
- Периодический опрос /api/logs и отображение последних событий.

## Ключевые файлы
- UI спец‑эндпоинтов: src/components/SoftphoneEndpoints.tsx
- Клиент для запросов к softphone: src/lib/softphoneClient.ts
- Главная страница (вкладки): src/app/page.tsx
- OpenAPI спецификация softphone: softphone-api.yaml
- OpenAPI (governor, при наличии): governor-api.yaml

## Загрузка и скачивание аудио
- Загрузка WAV: отправляем тело файла как octet-stream (File/Blob), заголовок Content-Type: application/octet-stream.
- Скачивание: создаём ссылку на blob и инициируем загрузку в браузере.

## CORS
Если softphoneUrl отличается от домена UI, убедитесь, что сервер softphone разрешает CORS (методы GET/POST/DELETE и нужные заголовки). Иначе используйте проксирование через backend‑роут в Next.js (можно добавить при необходимости).

## Сборка
```bash
npm run build
npm run start
```

## Типы и соответствие OpenAPI
- Все команды ChatIntegrationMessage содержат поле `type` (например, "setConfig", "removeConfig").
- Типы в TypeScript синхронизированы с softphone-api.yaml.

## Отладка
- Проверьте, что Softphone URL/Secret заданы верно.
- Смотрите ответы/ошибки в UI возле каждой кнопки, а также в консоли браузера.
- Проверьте CORS в случае запросов к другому хосту/порту.

## Примеры команд ChatIntegrationMessage
Ниже приведены минимальные примеры JSON‑payload для корневого POST / (формируются и отправляются из вкладки "Softphone Control"). Все объекты содержат поле `type`.

- say (текст)
```json
{
  "type": "say",
  "configId": "11111111-1111-1111-1111-111111111111",
  "phone": "+77011234567",
  "messageId": "m-bot-0001",
  "message": { "text": "Привет! Вы позвонили в поддержку." }
}
```
- hangUp
```json
{
  "type": "hangUp",
  "configId": "11111111-1111-1111-1111-111111111111",
  "phone": "+77011234567"
}
```
- dtmf
```json
{
  "type": "dtmf",
  "configId": "11111111-1111-1111-1111-111111111111",
  "phone": "+77011234567",
  "dtmf": "123#",
  "repeatCount": 1
}
```
- transfer
```json
{
  "type": "transfer",
  "configId": "11111111-1111-1111-1111-111111111111",
  "phone": "+77011234567",
  "targetUri": "tel:+78005553535"
}
```
- setConfig
```json
{
  "type": "setConfig",
  "configId": "11111111-1111-1111-1111-111111111111",
  "config": {
    "authenticationId": "1001",
    "registerPassword": "S3cret!",
    "hostUri": { "hostUri": "sip.my-voip.com" },
    "callerId": "+77010001122",
    "settings": {
      "language": "ru-RU",
      "synthesisService": "yandex",
      "vad": "algorithmic",
      "maxConcurrentCalls": 1
    }
  }
}
```
- removeConfig
```json
{
  "type": "removeConfig",
  "configId": "11111111-1111-1111-1111-111111111111"
}
```
- clearQueue
```json
{
  "type": "clearQueue",
  "configId": "11111111-1111-1111-1111-111111111111"
}
```

## Специальные эндпоинты — примеры cURL
Все запросы автоматически добавляют `?secret=...` при наличии секрета. Ниже приведены примеры, если вы вызываете softphone напрямую.

- Статус конфига (HTML)
```bash
curl "http://SOFTPHONE_IP:8080/status?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111"
```
- Очистить очередь исходящих
```bash
curl "http://SOFTPHONE_IP:8080/clear_queue?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111"
```
- Список сохранённых аудио
```bash
curl "http://SOFTPHONE_IP:8080/list_audio?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111"
```
- Загрузка WAV
```bash
curl -X POST "http://SOFTPHONE_IP:8080/audio?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111&file_name=hello.wav" \
     -H "Content-Type: application/octet-stream" --data-binary "@hello.wav"
```
- Удалить все аудио для конфига
```bash
curl -X DELETE "http://SOFTPHONE_IP:8080/audio?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111"
```
- Скачать WAV
```bash
curl -OJ "http://SOFTPHONE_IP:8080/get_audio?secret=SECRET&config_id=11111111-1111-1111-1111-111111111111&file_name=hello.wav"
```
- Перечитать SIP‑конфиги (с опциональным фильтром)
```bash
curl -X POST "http://SOFTPHONE_IP:8080/reload_sips?secret=SECRET&filter=1111"
```
- Текущие звонки по конфигам
```bash
curl "http://SOFTPHONE_IP:8080/current_calls?secret=SECRET"
```

## Соответствие типов и OpenAPI
- TypeScript‑типы синхронизированы с OpenAPI:
  - Поля `type` присутствуют в payload’ах `setConfig` и `removeConfig`.
  - Объединение ChatIntegrationMessage в TS покрывает все варианты из OpenAPI: say, hangUp, clearQueue, dtmf, transfer, setConfig, removeConfig.
- Файлы для справки:
  - OpenAPI спецификация softphone: <mcfile name="softphone-api.yaml" path="/Users/armanaubakirov/cks2/softphoneclient2/softphone-api.yaml"></mcfile>
  - Типы фронтенда: <mcfile name="types.ts" path="/Users/armanaubakirov/cks2/softphoneclient2/governor/src/lib/types.ts"></mcfile>

## Безопасность
- Секрет передаётся только как query‑параметр при запросах к softphone из браузера. Не храните секрет в репозитории, задавайте его через UI. Внутренний proxy‑роут может использоваться для скрытия секрета на серверной стороне, если вы его реализуете шире.
- Следите за CORS, если UI и softphone находятся на разных доменах/портах.

## Частые проблемы
- 400/403 ответы: проверьте корректность payload (особенно поле `type`) и секрет.
- CORS ошибки в браузере: добавьте разрешения на стороне softphone либо используйте проксирование через backend‑роут Next.js.
- Неверный softphone URL: убедитесь, что хост/порт доступны из браузера/сервера.

## Разработка
- Основные компоненты UI:
  - Вкладки и компоновка: src/app/page.tsx
  - Управление конфигами и командами: src/components/SoftphoneActions.tsx
  - Специальные эндпоинты: src/components/SoftphoneEndpoints.tsx
  - Клиент для работы с softphone: src/lib/softphoneClient.ts
- Соберите проект и проверьте, что все команды отрабатывают без ошибок:
```bash
npm run build
npm run start
```
