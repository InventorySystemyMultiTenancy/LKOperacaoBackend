import test from "node:test";
import assert from "node:assert/strict";
import { parsearVendasStats } from "../src/services/machinePayVendasParser.js";

// Linha no formato do extrato do painel (mesma estrutura tratada no projeto Toyland)
const linha = ({ data, valor, taxa, liquido, metodo, status, id, botao = true }) => `
<tr><td>
  <div>✅ ${data}</div>
  <div style="font-size: 12px; white-space: nowrap; text-shadow: 0 0 1px #000;">${metodo}</div>
  <div style="display:flex"><b>R$ ${valor}</b> <span>Cliente Pagou</span></div>
  <div style="display:flex"><b>R$ ${taxa}</b> <span>Banco Retirou</span></div>
  <div style="display:flex"><b>R$ ${liquido}</b> <span>Você Recebeu</span></div>
  <span style="background-color:#e8f5e9;color:#28a745;padding:2px">${status}</span>
  <div>🔍 ID PG: <strong>${id}</strong></div>
  ${botao ? `<button onclick="devolve('${id}')">Devolver</button>` : ""}
  <button onclick="apagarRegistro2(999)">Excluir</button>
</td></tr>`;

const html = `
<table>
  <tr><th>Pagamentos</th></tr>
  ${linha({ data: "09/10/2026-14:32:10", valor: "10.00", taxa: "0.10", liquido: "9.90", metodo: "✅ Pix", status: "Venda Aprovada", id: "123456789012" })}
  ${linha({ data: "09/10/2026-15:01:20", valor: "1250.50", taxa: "40.00", liquido: "1210.50", metodo: "💳 Crédito", status: "Venda Devolvida", id: "987654321098" })}
  ${linha({ data: "08/10/2026-09:00:00", valor: "5.00", taxa: "0.00", liquido: "5.00", metodo: "Manual", status: "Venda Aprovada", id: "555", botao: false })}
</table>`;

test("lê data, valores com ponto decimal, método, status e idwebhook do devolve()", () => {
  const [pix, credito, manual] = parsearVendasStats(html);
  assert.equal(pix.idwebhook, "123456789012");
  assert.equal(pix.data, "2026-10-09T17:32:10.000Z");
  assert.deepEqual([pix.valor, pix.taxa, pix.liquido], [10, 0.1, 9.9]);
  assert.equal(pix.tipo, "✅ Pix");
  assert.equal(pix.status, "Venda Aprovada");
  assert.equal(credito.valor, 1250.5);
  // Sem devolve(): cai no apagarRegistro2 só para identificar a linha
  assert.equal(manual.idwebhook, "999");
});

test("só permite devolver pagamento real, aprovado e ainda não devolvido", () => {
  const vendas = parsearVendasStats(html);
  assert.deepEqual(
    vendas.map((v) => [v.devolvido, v.podeDevolver]),
    [
      [false, true],
      [true, false],
      [false, false], // manual
    ],
  );
});

test("ignora linhas sem data de pagamento", () => {
  assert.deepEqual(parsearVendasStats(""), []);
  assert.deepEqual(parsearVendasStats("<tr><td>Bruto com Taxas MP R$ 0,00</td></tr>"), []);
});
