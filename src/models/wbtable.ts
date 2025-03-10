import _knex from "knex";
import knexConfig from "#config/knex/knexfile.js";
import { Warehouse } from "#types/types.js";
import { WarehouseData } from "#processing/data_processing.js";

export async function addWbData(data: WarehouseData, formattedDate: string): Promise<void> {
    const db = _knex(knexConfig);
    await db.transaction(async (trx) => {
        try {
            const today = new Date();
            const todayString = today.toISOString().split("T")[0];

            const existWbEntry = await trx("wbtable").where("day_date", ">=", todayString).first();

            let warehouseInfoId: number;
            const warehouseListJson = JSON.stringify(data.warehouseList);

            const dtNextBox = data.dtNextBox ? new Date(data.dtNextBox).toISOString().split("T")[0] : null;
            const dtTillMax = data.dtTillMax ? new Date(data.dtTillMax).toISOString().split("T")[0] : null;

            if (existWbEntry) {
                // Обновляем сегодняшние данные
                warehouseInfoId = existWbEntry.wbtable_id;
                await trx("wbtable").where("wbtable_id", warehouseInfoId).update({
                    day_date: formattedDate,
                    dtNextBox: dtNextBox,
                    dtTillMax: dtTillMax,
                    warehouseList: warehouseListJson,
                });
                console.log("Updated existing entry");
            } else {
                // Добавляем данные нового дня
                const [newSpreadsheets] = await trx("wbtable")
                    .insert({
                        day_date: formattedDate,
                        dtNextBox: dtNextBox,
                        dtTillMax: dtTillMax,
                        warehouseList: warehouseListJson,
                    })
                    .returning("wbtable_id");
                warehouseInfoId = newSpreadsheets;
                console.log("Added new entry");
            }
            console.log("Data updated/added successfully");
        } catch (error) {
            console.error("Error updating data:", error);
            throw error;
        }
    });
}

export interface WbDataRow {
    day_date: Date;
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: Warehouse[] | null;
}

export async function getWbData(): Promise<WbDataRow[]> {
    const db = _knex(knexConfig);

    try {
        const query = db("wbtable").select("day_date", "dtNextBox", "dtTillMax", "warehouseList");

        const results = await query;

        const formatDate = (date: any): string | null => {
            if (date === null || date === undefined || date === "") {
                return null;
            }
            const parsedDate = new Date(date);
            return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split("T")[0] : null;
        };

        const wbData = results.map((row) => ({
            day_date: new Date(row.day_date),
            dtNextBox: formatDate(row.dtNextBox),
            dtTillMax: formatDate(row.dtTillMax),
            warehouseList: row.warehouseList ? row.warehouseList : null,
        }));

        return wbData;
    } catch (error) {
        console.error("Error retrieving data:", error);
        throw error;
    }
}
