import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validarMinimoPorPersonalizacao } from "./cart";
const reg = { id: "r", label: "Regulagem", preco: 1, minimo: 5 };
describe("mínimo por personalização", () => {
  it("bloqueia com 4 peças quando o mínimo é 5", () => {
    assert.notEqual(validarMinimoPorPersonalizacao([{ quantidade: 4, personalizacoes: [reg] }]), null);
  });
  it("libera com 5 peças somando produtos diferentes", () => {
    assert.equal(validarMinimoPorPersonalizacao([
      { quantidade: 3, personalizacoes: [reg] },
      { quantidade: 2, personalizacoes: [{ ...reg, id: "x", minimo: 0 }] },
    ]), null);
  });
});
