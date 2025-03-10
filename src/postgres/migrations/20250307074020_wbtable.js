/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */

export async function up(knex) {
    return knex.schema.createTable("wbtable", (table) => {
        table.increments("wbtable_id").primary();
        table.jsonb("warehouseList").nullable();
        table.timestamp("day_date").unique().notNullable();
        table.date("dtNextBox").nullable;
        table.date("dtTillMax").nullable;
        table.timestamps(true, true);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */

export async function down(knex) {
    return knex.schema.dropTable("wbtable");
}
