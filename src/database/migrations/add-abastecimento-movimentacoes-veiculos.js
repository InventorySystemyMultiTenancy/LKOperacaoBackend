import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("movimentacoes_veiculos", "litrosAbastecidos", {
    type: DataTypes.DECIMAL(6,2),
    allowNull: false,
    defaultValue: 0,
    comment: "Quantidade de litros abastecidos na movimentação"
  });
  await queryInterface.addColumn("movimentacoes_veiculos", "postoAbastecimento", {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "",
    comment: "Nome do posto de abastecimento na movimentação"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("movimentacoes_veiculos", "litrosAbastecidos");
  await queryInterface.removeColumn("movimentacoes_veiculos", "postoAbastecimento");
}
