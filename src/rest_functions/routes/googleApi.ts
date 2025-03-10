import _knex from "knex";
import google from "@googleapis/sheets";
import credentialsGoogle from "#data/credentials.json" with { type: "json" };
import { fetchSpreadsheetData } from "#models/spreadsheets.js";
import { getWbData } from "#models/wbtable.js";

async function writeHeaders(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string, headers: string[]) {
    const range = `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`;

    try {
        await client.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "RAW",
            requestBody: {
                values: [headers],
            },
        });
        console.log("Заголовки написаны в листе таблицы.");
    } catch (error) {
        console.error("Ошибка при записи заголовков:", error);
    }
}

async function clearData(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string) {
    const range = `${sheetName}!A2:Z`;

    try {
        await client.spreadsheets.values.clear({
            spreadsheetId,
            range,
        });
        console.log("Прошлые данные убраны из таблицы.");
    } catch (error) {
        console.error("Ошибка при очищений листа таблицы:", error);
    }
}

async function appendData(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string, data: any) {
    await clearData(client, spreadsheetId, sheetName);
    const range = `${sheetName}!A2`; // Добавляем информацию начиная со второго ряда

    try {
        await client.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "RAW",
            requestBody: {
                values: data,
            },
        });
        console.log("Информация добавлена на лист");
    } catch (error) {
        console.error("Ошибка при добавлений информации:", error);
    }
}

async function getLastRow(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string): Promise<number> {
    const response = await client.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:A`,
    });

    const values = response.data.values;
    return values ? values.length : 0; // Возвращаем количество рядов в листе
}

async function getSheetIdByName(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string): Promise<number | null> {
    const response = await client.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    });

    const sheetsData = response.data.sheets;
    if (!sheetsData || sheetsData.length === 0) {
        console.error("Нет листов в таблице.");
        return null;
    }

    for (const sheet of sheetsData) {
        if (sheet.properties && sheet.properties.title === sheetName) {
            const sheetId = sheet.properties.sheetId;
            if (typeof sheetId === "number") {
                return sheetId;
            }
        }
    }

    console.error(`Листа "${sheetName}" не обнаружено.`);
    return null; // Возвращяем null если нет листа с именем
}

async function createSheetIfNotExists(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string) {
    try {
        const response = await client.spreadsheets.get({
            spreadsheetId,
        });

        const sheetsList = response.data.sheets;
        const sheetExists = sheetsList?.some((sheet) => sheet.properties?.title === sheetName);

        if (!sheetExists) {
            const request = {
                "spreadsheetId": spreadsheetId,
                "resource": {
                    "requests": [
                        {
                            "addSheet": {
                                "properties": {
                                    "title": sheetName,
                                },
                            },
                        },
                    ],
                },
            };

            await client.spreadsheets.batchUpdate(request, (err: any, response: any) => {
                if (err) {
                    console.error("Ошибка при созданий листа:", err);
                    return err;
                } else {
                    console.log(`Лист "${sheetName}" создан успешно.`);
                }
            });
        } else {
            console.log(`Лист "${sheetName}" уже сушествует.`);
        }
    } catch (error) {
        console.error("Ошибка при созданий листа:", error);
    }
}

async function sortData(client: google.sheets_v4.Sheets, spreadsheetId: string, sheetName: string) {
    const sheetId = await getSheetIdByName(client, spreadsheetId, sheetName);
    if (sheetId === null) {
        return false;
    }
    const lastRow = await getLastRow(client, spreadsheetId, sheetName);

    // Параметры сортировки
    const sortRequest = {
        requests: [
            {
                sortRange: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 1,
                        endRowIndex: lastRow,
                        startColumnIndex: 0,
                        endColumnIndex: 9,
                    },
                    sortSpecs: [
                        {
                            dimensionIndex: 2,
                            sortOrder: "ASCENDING",
                        },
                    ],
                },
            },
        ],
    };

    try {
        const response = await client.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            requestBody: sortRequest,
        });
        console.log("Данные отсортированы успешно:");
    } catch (error) {
        console.error("Ошибка при сортировке данных:", error);
    }
}

export async function exportToGoogleSheets(): Promise<any> {
    const spreadsheetData = await fetchSpreadsheetData();
    const Wbtabledata = await getWbData();

    // логин Google

    const googleAuth = await new google.auth.GoogleAuth({
        credentials: credentialsGoogle,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await google.sheets({
        version: "v4",
        auth: googleAuth,
    });
    const sheetName = "stocks_coefs";

    const firstEntry = spreadsheetData[0];
    const parsedData = JSON.parse(firstEntry.spreadsheet_id);
    const spreadsheetIds = parsedData.table_id;

    for (const spreadsheetId of spreadsheetIds) {
        // Создаем лист в таблице
        await createSheetIfNotExists(client, spreadsheetId, sheetName);

        // Заголовки в таблице
        const headers = [
            "ID",
            "Warehouse Name",
            "Box Delivery and Storage Expr",
            "Box Delivery Base",
            "Box Delivery Liter",
            "Box Storage Base",
            "Box Storage Liter",
            "Next Box Date",
            "Till Max Date",
        ];
        await writeHeaders(client, spreadsheetId, sheetName, headers);

        // Готовим данные для вставки в таблицы
        let globalIndex = 1;
        const dataToInsert = Wbtabledata.flatMap((data) => {
            return data.warehouseList?.map((warehouse) => [
                globalIndex++,
                warehouse.warehouseName,
                parseFloat(warehouse.boxDeliveryAndStorageExpr.replace(",", ".")) || 0,
                parseFloat(warehouse.boxDeliveryBase.replace(",", ".")) || 0,
                parseFloat(warehouse.boxDeliveryLiter.replace(",", ".")) || 0,
                parseFloat(warehouse.boxStorageBase.replace(",", ".")) || 0,
                parseFloat(warehouse.boxStorageLiter.replace(",", ".")) || 0,
                data.dtNextBox ? data.dtNextBox : null,
                data.dtTillMax ? data.dtTillMax : null,
            ]);
        });

        // Добавляем значения в таблицу
        await appendData(client, spreadsheetId, sheetName, dataToInsert);
        await sortData(client, spreadsheetId, sheetName);
    }
}
