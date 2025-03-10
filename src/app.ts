import { migrate, seed } from "#postgres/knex.js";
import { addWbData } from "#models/wbtable.js";
import { getTariffs } from "#rest_functions/routes/wildberriesApi.js";
import { transformData } from "#processing/data_processing.js";
import { fillSpreadsheetTable, fetchSpreadsheetData } from "#models/spreadsheets.js";
import { exportToGoogleSheets } from "#rest_functions/routes/googleApi.js";

await migrate.latest();
await seed.run();

const runTasks = async () => {
    await migrate.latest();
    await seed.run();

    const apiUrl: string = "https://common-api.wildberries.ru/api/v1/tariffs/box";
    console.log("All migrations and seeds have been run");

    // Wildberries
    const tariffData = await getTariffs(apiUrl);
    const transformedData = transformData(tariffData);
    await addWbData(transformedData, new Date().toISOString().split(".")[0]);

    // Google таблицы
    await fillSpreadsheetTable();
    await fetchSpreadsheetData();
    await exportToGoogleSheets();
};

await runTasks();

// Исполняем программу каждый час
setInterval(async () => {
    console.log('Running scheduled tasks...');
    await runTasks();
}, 3600000);

console.log('Scheduler started. Tasks will run every hour.');