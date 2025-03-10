import table_id from "#data/googlesheetid.json" with { type: "json" };
import _knex from "knex";
import knexConfig from "#config/knex/knexfile.js";

export async function fillSpreadsheetTable(): Promise<any> {
    const db = _knex(knexConfig);

    try {
        await db.transaction(async (trx) => {
            await trx("spreadsheets").del();
            const [newSpreadsheet] = await trx("spreadsheets")
                .insert({
                    spreadsheet_id: JSON.stringify(table_id),
                })
                .returning("*");

            console.log("Обновлены таблицы");
        });

        console.log("Информация о google таблицах добавлена в db");
    } catch (error) {
        console.error("Ошибка при заполнение таблицы spreadsheets:", error);
    } finally {
        await db.destroy(); 
    }
}

export async function fetchSpreadsheetData(): Promise<any> {
    const db = _knex(knexConfig);

    try {
        const data = await db("spreadsheets").select("*"); 

        console.log("Информация о google таблицах получена из db");
        return data;
    } catch (error) {
        console.error("Ошибка при получении данных из таблицы spreadsheets:", error);
        throw error;
    } finally {
        await db.destroy();
    }
}
