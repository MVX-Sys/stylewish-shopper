import { jsPDF } from "jspdf";
import { brl } from "./format";
import { BRAND } from "./config";
import type { ProductListItem } from "./products";
import type { CartItem } from "./cart";

const ORANGE: [number, number, number] = [255, 85, 0];
const DARK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [229, 231, 235];

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "arquivo";
}

function header(doc: jsPDF, title: string) {
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(BRAND, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 14, { align: "right" });
  doc.setTextColor(...DARK);
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(14, h - 16, w - 14, h - 16);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `${BRAND} · Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
    14,
    h - 9,
  );
  doc.setTextColor(...DARK);
}

export function downloadProductPDF(p: ProductListItem, categoriaNome?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Ficha do produto");

  let y = 32;
  if (p.marca) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(p.marca.toUpperCase(), 14, y);
    y += 5;
    doc.setTextColor(...DARK);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const nomeLines = doc.splitTextToSize(p.nome, 180);
  doc.text(nomeLines, 14, y);
  y += nomeLines.length * 7 + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ORANGE);
  doc.text(brl(p.preco), 14, y + 4);
  doc.setTextColor(...DARK);
  y += 12;

  const badges: string[] = [];
  if (p.novidade) badges.push("NOVIDADE");
  if (p.promocao) badges.push("PROMOÇÃO");
  if (categoriaNome) badges.push(categoriaNome.toUpperCase());
  if (badges.length) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let x = 14;
    for (const b of badges) {
      const w = doc.getTextWidth(b) + 6;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(x, y - 4, w, 6, 1.5, 1.5, "F");
      doc.setTextColor(...DARK);
      doc.text(b, x + 3, y);
      x += w + 3;
    }
    y += 8;
  }

  doc.setDrawColor(...LINE);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Descrição", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const desc = p.descricao?.trim() || "Sem descrição cadastrada.";
  const descLines = doc.splitTextToSize(desc, 182);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 6;

  if (p.variacoes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Variações disponíveis", 14, y);
    y += 6;

    doc.setFillColor(249, 250, 251);
    doc.rect(14, y - 4, 182, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text("COR", 18, y);
    doc.text("TAMANHO", 90, y);
    doc.text("ESTOQUE", 160, y);
    doc.setTextColor(...DARK);
    y += 5;

    doc.setFont("helvetica", "normal");
    for (const v of p.variacoes) {
      if (y > 270) {
        footer(doc);
        doc.addPage();
        header(doc, "Ficha do produto");
        y = 32;
      }
      doc.setDrawColor(...LINE);
      doc.line(14, y + 1, 196, y + 1);
      y += 5;
      doc.text(v.nome_cor, 18, y);
      doc.text(v.tamanho, 90, y);
      doc.text(String(v.quantidade_estoque), 160, y);
      y += 2;
    }
  }

  footer(doc);
  doc.save(`produto-${slugify(p.nome)}.pdf`);
}

export type OrderPDFPayload = {
  items: CartItem[];
  total: number;
  formaEnvio: string;
  formaEntrega?: string;
  formaPagamento: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string;
  };
  observacoes?: string;
};

export function downloadOrderPDF(order: OrderPDFPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Resumo do pedido");

  let y = 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Pedido", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(new Date().toLocaleString("pt-BR"), 196, y, { align: "right" });
  doc.setTextColor(...DARK);
  y += 8;

  // Items table
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y - 4, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("QTD", 18, y);
  doc.text("PRODUTO", 32, y);
  doc.text("UNIT.", 150, y);
  doc.text("SUBTOTAL", 196, y, { align: "right" });
  doc.setTextColor(...DARK);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const it of order.items) {
    if (y > 260) {
      footer(doc);
      doc.addPage();
      header(doc, "Resumo do pedido");
      y = 32;
    }
    const desc = `${it.nome} — ${it.cor} · ${it.tamanho}`;
    const lines = doc.splitTextToSize(desc, 112);
    doc.text(String(it.quantidade), 18, y);
    doc.text(lines, 32, y);
    doc.text(brl(it.preco), 150, y);
    doc.text(brl(it.preco * it.quantidade), 196, y, { align: "right" });
    y += Math.max(lines.length * 5, 6);
    doc.setDrawColor(...LINE);
    doc.line(14, y - 2, 196, y - 2);
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", 150, y);
  doc.setTextColor(...ORANGE);
  doc.text(brl(order.total), 196, y, { align: "right" });
  doc.setTextColor(...DARK);
  y += 10;

  // Envio / pagamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Envio e pagamento", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Forma de envio: ${order.formaEnvio}`, 14, y);
  y += 5;
  if (order.formaEntrega) {
    doc.text(`Forma de entrega: ${order.formaEntrega}`, 14, y);
    y += 5;
  }
  doc.text(`Forma de pagamento: ${order.formaPagamento}`, 14, y);
  y += 8;

  if (order.endereco) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Endereço de entrega", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const e = order.endereco;
    const linhas = [
      `CEP: ${e.cep}`,
      `${e.logradouro}, ${e.numero}${e.complemento ? ` — ${e.complemento}` : ""}`,
      `Bairro: ${e.bairro}`,
      `Cidade/UF: ${e.cidade}/${e.estado}`,
      e.referencia ? `Referência: ${e.referencia}` : null,
    ].filter(Boolean) as string[];
    for (const l of linhas) {
      doc.text(l, 14, y);
      y += 5;
    }
    y += 3;
  }

  if (order.observacoes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Observações", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const obs = doc.splitTextToSize(order.observacoes, 182);
    doc.text(obs, 14, y);
  }

  footer(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`pedido-${BRAND.toLowerCase()}-${stamp}.pdf`);
}

export type AuditLogExport = {
  criado_em: string;
  user_email: string | null;
  user_id: string;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  descricao: string | null;
  detalhes: Record<string, unknown> | null;
};

function formatDateBR(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function downloadAuditCSV(rows: AuditLogExport[]) {
  const headers = ["Data/Hora", "Usuário", "Ação", "Entidade", "ID Entidade", "Descrição", "Detalhes"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escape).join(";")];
  for (const r of rows) {
    lines.push(
      [
        formatDateBR(r.criado_em),
        r.user_email ?? r.user_id,
        r.acao,
        r.entidade,
        r.entidade_id ?? "",
        r.descricao ?? "",
        r.detalhes ? JSON.stringify(r.detalhes) : "",
      ]
        .map(escape)
        .join(";"),
    );
  }
  const csv = "\ufeff" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `auditoria-${slugify(BRAND)}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAuditPDF(rows: AuditLogExport[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(doc, "Histórico de auditoria");

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${rows.length} registro(s)`, 14, y);
  doc.setTextColor(...DARK);
  y += 6;

  const cols = [
    { label: "Data/Hora", x: 14, width: 32 },
    { label: "Usuário", x: 46, width: 55 },
    { label: "Ação", x: 101, width: 32 },
    { label: "Entidade", x: 133, width: 26 },
    { label: "Descrição", x: 159, width: w - 14 - 159 },
  ];

  const drawHead = () => {
    doc.setFillColor(...ORANGE);
    doc.rect(14, y, w - 28, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    for (const c of cols) doc.text(c.label, c.x + 1, y + 5);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    y += 7;
  };
  drawHead();

  doc.setFontSize(8);
  for (const r of rows) {
    const cells = [
      formatDateBR(r.criado_em),
      r.user_email ?? r.user_id.slice(0, 12),
      r.acao,
      r.entidade,
      r.descricao ?? "",
    ];
    const wrapped = cells.map((v, i) => doc.splitTextToSize(String(v), cols[i].width - 2));
    const rowH = Math.max(...wrapped.map((l) => l.length)) * 4 + 2;
    if (y + rowH > h - 18) {
      footer(doc);
      doc.addPage();
      header(doc, "Histórico de auditoria");
      y = 30;
      drawHead();
      doc.setFontSize(8);
    }
    doc.setDrawColor(...LINE);
    doc.line(14, y + rowH, w - 14, y + rowH);
    for (let i = 0; i < cols.length; i++) {
      doc.text(wrapped[i], cols[i].x + 1, y + 4);
    }
    y += rowH;
  }

  footer(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`auditoria-${slugify(BRAND)}-${stamp}.pdf`);
}
