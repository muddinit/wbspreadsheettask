## Описание

1. **Миграции для базы данных**:
   - Подготовлены миграции для создания необходимых таблиц в PostgreSQL.
   - Таблицы будут хранить данные о тарифах, полученные из API.

2. **Логика получения данных**:
   - Реализована логика для получения данных по API "Тарифы коробов".
   - Данные будут запрашиваться ежечасно и обновляться в базе данных.

3. **Хранение данных**:
   - Данные о тарифах будут накапливаться в базе данных для каждого дня.
   - Информация, получаемая ежечасно в течение одного дня, будет обновлять уже имеющиеся на этот день данные.

4. **Выгрузка данных в Google Таблицы**:
   - Создан механизм выгрузки данных из PostgreSQL в произвольное количество Google Таблиц каждый час и сортированы по коэффициенту.
   - Данные будут выгружаться на лист `stocks_coefs`, если листа нет он будет создаваться.
   - Учтено, что ссылки на таблицы могут меняться, и количество таблиц может быть произвольным.

## Файлы конфигураций

Для правильной работы приложения нужно

- Переименовать example.env в .env
- Ввести ключ API WILDBERRIES в .env
- Ввести данные сервис аккаунта Google в /src/data/credentials.json
- Ввести id таблиц google в /src/data/googlesheetid.json

## Команды:

Для проверки :
```bash
git clone https://github.com/muddinit/wbspreadsheettask.git
cd wbspreadsheettask
docker compose down --rmi local --volumes
docker compose up --build
```
