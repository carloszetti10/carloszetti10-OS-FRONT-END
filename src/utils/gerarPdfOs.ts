import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { LOGO_NORTESYS_BASE64 } from "@/assets/logoNortesysBase64";

export interface DadosPdfOs {
  tituloOs: string;
  nomeCliente: string;
  documentoCliente: string;
  dataHoraInicio?: string | null;
  dataHoraFim?: string | null;
  corpoTexto: string; // relatório técnico (ou descrição, se o relatório ainda estiver vazio)
  nomeFuncionario: string;
  assinaturaFuncionarioBase64?: string | null;
  nomeSignatarioCliente?: string;
  assinaturaClienteBase64?: string | null;
  dataAssinaturaCliente?: string | null;
}

/**
 * Monta o PDF da OS a partir do modelo NORTESYS (título, dados da empresa,
 * corpo do relatório e as duas assinaturas — Cliente à esquerda, Consultor
 * à direita, igual ao modelo em .docx enviado). Roda 100% no navegador
 * (pdf-lib) — nada disso passa pelo back até o momento de salvar.
 */
export async function gerarPdfOs(dados: DadosPdfOs): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 retrato, em pontos
  const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margem = 56;
  const larguraUtil = page.getWidth() - margem * 2;

  // Logo NORTESYS no topo, centralizado — igual ao modelo em .docx enviado.
  const logo = await pdfDoc.embedPng(base64ParaUint8Array(LOGO_NORTESYS_BASE64));
  const logoLargura = 170;
  const logoAltura = (logo.height / logo.width) * logoLargura;
  page.drawImage(logo, {
    x: (page.getWidth() - logoLargura) / 2,
    y: page.getHeight() - 40 - logoAltura,
    width: logoLargura,
    height: logoAltura,
  });

  let y = page.getHeight() - 60 - logoAltura;

  // Título
  const tituloLargura = fonteNegrito.widthOfTextAtSize("ORDEM DE SERVIÇO", 16);
  page.drawText("ORDEM DE SERVIÇO", {
    x: (page.getWidth() - tituloLargura) / 2,
    y,
    size: 16,
    font: fonteNegrito,
    color: rgb(0.05, 0.08, 0.07),
  });
  y -= 34;

  const { data: dataInicio, hora: horaInicio } = separarDataHora(dados.dataHoraInicio);
  const { data: dataFim, hora: horaFim } = separarDataHora(dados.dataHoraFim);

  y = escreverCampo(page, fonte, fonteNegrito, margem, y, "Data Início:", dataInicio, "Data Término:", dataFim);
  y -= 20;
  y = escreverCampo(page, fonte, fonteNegrito, margem, y, "Horário início:", horaInicio, "Horário Término:", horaFim);
  y -= 28;
  y = escreverCampo(page, fonte, fonteNegrito, margem, y, "Nome da Empresa:", dados.nomeCliente);
  y -= 22;
  y = escreverCampo(page, fonte, fonteNegrito, margem, y, "CNPJ/CPF:", dados.documentoCliente);
  y -= 32;

  // Corpo (relatório técnico / descrição), com quebra de linha automática
  const linhas = quebrarLinhas(dados.corpoTexto || "—", fonte, 10.5, larguraUtil);
  for (const linha of linhas) {
    if (y < 190) break; // não invade a área reservada das assinaturas
    page.drawText(linha, { x: margem, y, size: 10.5, font: fonte, color: rgb(0.15, 0.15, 0.15) });
    y -= 15;
  }

  // Assinaturas: Cliente à esquerda, Consultor (funcionário) à direita —
  // mesma disposição do modelo em .docx.
  const yAssinatura = 140;
  const larguraColuna = larguraUtil / 2 - 14;

  await desenharAssinatura(pdfDoc, page, fonte, fonteNegrito, {
    x: margem,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Cliente",
    nome: dados.nomeSignatarioCliente || dados.nomeCliente,
    assinaturaBase64: dados.assinaturaClienteBase64,
    dataAssinatura: dados.dataAssinaturaCliente,
  });

  await desenharAssinatura(pdfDoc, page, fonte, fonteNegrito, {
    x: margem + larguraColuna + 28,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Consultor",
    nome: dados.nomeFuncionario,
    assinaturaBase64: dados.assinaturaFuncionarioBase64,
    dataAssinatura: null,
  });

  return pdfDoc.save();
}

function escreverCampo(
  page: PDFPage,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  x: number,
  y: number,
  rotulo1: string,
  valor1: string,
  rotulo2?: string,
  valor2?: string
): number {
  page.drawText(rotulo1, { x, y, size: 10.5, font: fonteNegrito });
  const larguraRotulo1 = fonteNegrito.widthOfTextAtSize(rotulo1, 10.5);
  page.drawText(valor1 || "—", { x: x + larguraRotulo1 + 6, y, size: 10.5, font: fonte });

  if (rotulo2) {
    const x2 = x + 280;
    page.drawText(rotulo2, { x: x2, y, size: 10.5, font: fonteNegrito });
    const larguraRotulo2 = fonteNegrito.widthOfTextAtSize(rotulo2, 10.5);
    page.drawText(valor2 || "—", { x: x2 + larguraRotulo2 + 6, y, size: 10.5, font: fonte });
  }

  return y;
}

async function desenharAssinatura(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  opcoes: {
    x: number;
    y: number;
    largura: number;
    rotulo: string;
    nome: string;
    assinaturaBase64?: string | null;
    dataAssinatura?: string | null;
  }
) {
  const { x, y, largura, rotulo, nome, assinaturaBase64, dataAssinatura } = opcoes;

  if (assinaturaBase64) {
    try {
      const png = await pdfDoc.embedPng(base64ParaUint8Array(assinaturaBase64));
      const alturaMax = 46;
      const escala = Math.min(largura / png.width, alturaMax / png.height);
      const largImg = png.width * escala;
      const altImg = png.height * escala;
      page.drawImage(png, {
        x: x + (largura - largImg) / 2,
        y: y + 4,
        width: largImg,
        height: altImg,
      });
    } catch {
      // assinatura em formato inesperado — segue sem travar a geração do PDF
    }
  }

  // Linha
  page.drawLine({
    start: { x, y },
    end: { x: x + largura, y },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  const rotuloLargura = fonteNegrito.widthOfTextAtSize(rotulo, 11);
  page.drawText(rotulo, { x: x + (largura - rotuloLargura) / 2, y: y - 16, size: 11, font: fonteNegrito });

  const nomeExibido = nome.length > 40 ? nome.slice(0, 37) + "…" : nome;
  const nomeLargura = fonte.widthOfTextAtSize(nomeExibido, 9);
  page.drawText(nomeExibido, {
    x: x + (largura - nomeLargura) / 2,
    y: y - 30,
    size: 9,
    font: fonte,
    color: rgb(0.4, 0.4, 0.4),
  });

  if (dataAssinatura) {
    const texto = `Assinado em ${new Date(dataAssinatura).toLocaleString("pt-BR")}`;
    const textoLargura = fonte.widthOfTextAtSize(texto, 8);
    page.drawText(texto, {
      x: x + (largura - textoLargura) / 2,
      y: y - 42,
      size: 8,
      font: fonte,
      color: rgb(0.55, 0.55, 0.55),
    });
  }
}

function separarDataHora(iso?: string | null): { data: string; hora: string } {
  if (!iso) return { data: "", hora: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { data: "", hora: "" };
  return {
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function quebrarLinhas(texto: string, fonte: PDFFont, tamanho: number, larguraMax: number): string[] {
  const palavras = texto.replace(/\r/g, "").split(/\s+/);
  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (fonte.widthOfTextAtSize(tentativa, tamanho) > larguraMax && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = tentativa;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);
  return linhas;
}

/** Uint8Array -> base64, em pedaços pra não estourar a pilha de chamadas em PDFs grandes. */
export function uint8ArrayParaBase64(bytes: Uint8Array): string {
  let binario = "";
  const tamanhoBloco = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoBloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanhoBloco));
  }
  return btoa(binario);
}

/** base64 -> Uint8Array (aceita string com ou sem o prefixo "data:image/...;base64,") */
export function base64ParaUint8Array(base64: string): Uint8Array {
  const semPrefixo = base64.replace(/^data:.*;base64,/, "");
  const binario = atob(semPrefixo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
