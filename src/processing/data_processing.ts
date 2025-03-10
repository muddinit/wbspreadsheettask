import { WbTariffs } from "#rest_functions/routes/wildberriesApi.js";
import { Warehouse } from "#types/types.js";

export interface WarehouseData {
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: Warehouse[] | null;
}


export function transformData(rawData: WbTariffs): WarehouseData {
    const transformedData = {
        dtNextBox: rawData.dtNextBox || null,
        dtTillMax: rawData.dtTillMax || null,
        warehouseList: rawData.warehouseList,
    };
    return transformedData;
}
