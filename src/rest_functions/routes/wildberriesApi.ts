import env from "#config/env/env.js";
import { Warehouse } from "#types/types.js";

export interface WbTariffs {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: Warehouse[] | null;
}

interface WbApiReturn {
    response: {
        data: WbTariffs;
    };
}

export async function getTariffs(apiUrl: string): Promise<WbTariffs> {
    try {
        const formattedDate = new Date().toISOString().split("T")[0];
        const apiUrlWithDate = `${apiUrl}?date=${encodeURIComponent(formattedDate)}`;

        const response: Response = await fetch(apiUrlWithDate, {
            method: "GET",
            headers: {
                "Authorization": env.WB_API_KEY,
                "Content-Type": "application/json",
            },
        });

        // Check if the response is not OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "No message"}`);
        }

        const responseJSON: WbApiReturn = await response.json();
        return responseJSON.response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}
