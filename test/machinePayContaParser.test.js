import test from "node:test";
import assert from "node:assert/strict";
import { candidatosUsrPorNome, trechoAoRedorDoNome } from "../src/services/machinePayContaParser.js";
import { ehDaContaConfigurada } from "../src/services/machinePayMonitorService.js";

process.env.MACHINE_PAY_CONTA_NOME = "Gleison Lucas da silva";

test("acha o usr no select de Cliente", () => {
  const html = `<label>Cliente</label><select id="cliente" onchange="trocarCliente(this.value)">
    <option value="">Selecione</option>
    <option value="8147637329025815">Clube Kids(LIVIA)</option>
    <option value="9031122">Gleison Lucas da silva</option></select>`;
  const c = candidatosUsrPorNome(html, process.env.MACHINE_PAY_CONTA_NOME, ehDaContaConfigurada);
  assert.equal(c[0].usrId, "9031122");
  assert.equal(c.some((x) => x.usrId === "8147637329025815"), false);
});

test("acha o usr em data-id e em link usr= perto do nome", () => {
  const datalist = `<datalist id="clientes"><option data-id="555" value="Gleison Lucas da silva"></option></datalist>`;
  assert.equal(candidatosUsrPorNome(datalist, "Gleison Lucas da silva", ehDaContaConfigurada)[0].usrId, "555");
  const link = `<a href="maquinas.php?acao=maquinas&usr=777">GLEISON LUCAS DA SILVA</a>`;
  assert.equal(candidatosUsrPorNome(link, "Gleison Lucasda Silva", ehDaContaConfigurada)[0].usrId, "777");
});

test("trecho para diagnóstico", () => {
  assert.match(trechoAoRedorDoNome("<b>Gleison Lucas da silva</b>", "Gleison Lucasda Silva"), /Gleison/);
  assert.equal(trechoAoRedorDoNome("<b>Outro</b>", "Gleison"), null);
});
