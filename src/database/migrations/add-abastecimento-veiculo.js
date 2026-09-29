import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("veiculos", "litrosAbastecidos", {
    type: DataTypes.DECIMAL(6,2),
    allowNull: false,
    defaultValue: 0,
    comment: "Quantidade de litros abastecidos na última pilotagem"
  });
  await queryInterface.addColumn("veiculos", "postoAbastecimento", {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "",
    comment: "Nome do posto de abastecimento na última pilotagem"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("veiculos", "litrosAbastecidos");
  await queryInterface.removeColumn("veiculos", "postoAbastecimento");
}
