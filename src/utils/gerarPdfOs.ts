import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { LOGO_NORTESYS_BASE64 } from "@/assets/logoNortesysBase64";

export interface DadosPdfOs {
  idOs: number;
  tituloOs: string;
  descricao: string;
  relatorioTecnico: string;
  nomeCliente: string;
  documentoCliente: string;
  nomeTipoAtendimento?: string;
  dataHoraInicio?: string | null;
  dataHoraFim?: string | null;
  nomeFuncionario: string;
  assinaturaFuncionarioBase64?: string | null;
  nomeSignatarioCliente?: string;
  assinaturaClienteBase64?: string | null;
  dataAssinaturaCliente?: string | null;
}

// Paleta (mesmas cores da marca usadas no sistema)
const VERDE = rgb(0.086, 0.643, 0.42); // brand-600
const VERDE_ESCURO = rgb(0.07, 0.31, 0.24); // brand-900
const CINZA_ESCURO = rgb(0.11, 0.14, 0.13);
const CINZA_TEXTO = rgb(0.28, 0.31, 0.3);
const CINZA_LABEL = rgb(0.55, 0.58, 0.57);
const CINZA_FUNDO = rgb(0.965, 0.976, 0.972);
const CINZA_BORDA = rgb(0.86, 0.88, 0.87);

const MARGEM = 48;
const LARGURA_PAGINA = 595.28;
const ALTURA_PAGINA = 841.89;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

/**
 * Monta o PDF da OS com um layout próprio (não replica o modelo .docx):
 * cabeçalho com logo + título + código da OS, um bloco de dados em
 * "cards" (cliente/documento/tipo/datas), descrição, relatório técnico e,
 * por fim, as assinaturas — Cliente à esquerda, Consultor à direita.
 * Roda 100% no navegador (pdf-lib).
 */
export async function gerarPdfOs(dados: DadosPdfOs): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]);
  const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = ALTURA_PAGINA - 44;

  // ===== Cabeçalho: logo + título + código da OS =====
  const logo = await pdfDoc.embedPng(base64ParaUint8Array(LOGO_NORTESYS_BASE64));
  const logoLargura = 108;
  const logoAltura = (logo.height / logo.width) * logoLargura;
  page.drawImage(logo, { x: MARGEM, y: y - logoAltura + 6, width: logoLargura, height: logoAltura });

  const codigoOs = `Nº ${String(dados.idOs).padStart(6, "0")}`;
  const codigoLargura = fonteNegrito.widthOfTextAtSize(codigoOs, 12);
  page.drawText(codigoOs, { x: LARGURA_PAGINA - MARGEM - codigoLargura, y: y - 6, size: 12, font: fonteNegrito, color: VERDE_ESCURO });

  const rotuloOsLargura = fonte.widthOfTextAtSize("ORDEM DE SERVIÇO", 10);
  page.drawText("ORDEM DE SERVIÇO", {
    x: LARGURA_PAGINA - MARGEM - rotuloOsLargura,
    y: y - 20,
    size: 10,
    font: fonte,
    color: CINZA_LABEL,
  });

  y -= Math.max(logoAltura + 4, 34);

  // Linha divisória verde
  page.drawLine({ start: { x: MARGEM, y }, end: { x: LARGURA_PAGINA - MARGEM, y }, thickness: 2, color: VERDE });
  y -= 26;

  // Título da OS
  page.drawText(dados.tituloOs || "Ordem de Serviço", {
    x: MARGEM,
    y,
    size: 16,
    font: fonteNegrito,
    color: CINZA_ESCURO,
  });
  y -= 28;

  // ===== Bloco de dados em "cards" (2 colunas x 3 linhas) =====
  const colunaLargura = (LARGURA_UTIL - 16) / 2;
  const { data: dataInicio, hora: horaInicio } = separarDataHora(dados.dataHoraInicio);
  const { data: dataFim, hora: horaFim } = separarDataHora(dados.dataHoraFim);

  const linhasGrid: [string, string, string, string][] = [
    ["CLIENTE", dados.nomeCliente || "—", "DOCUMENTO", dados.documentoCliente || "—"],
    ["TIPO DE ATENDIMENTO", dados.nomeTipoAtendimento || "—", "CONSULTOR RESPONSÁVEL", dados.nomeFuncionario || "—"],
    ["DATA/HORA DE INÍCIO", dataInicio ? `${dataInicio} às ${horaInicio || "—"}` : "—", "DATA/HORA DE TÉRMINO", dataFim ? `${dataFim} às ${horaFim || "—"}` : "—"],
  ];

  const alturaLinhaGrid = 40;
  const alturaCaixaGrid = linhasGrid.length * alturaLinhaGrid + 20;

  page.drawRectangle({
    x: MARGEM,
    y: y - alturaCaixaGrid,
    width: LARGURA_UTIL,
    height: alturaCaixaGrid,
    color: CINZA_FUNDO,
    borderColor: CINZA_BORDA,
    borderWidth: 1,
  });

  let yGrid = y - 22;
  for (const [rotulo1, valor1, rotulo2, valor2] of linhasGrid) {
    desenharCelula(page,  fonteNegrito, MARGEM + 16, yGrid, rotulo1, valor1);
    desenharCelula(page,  fonteNegrito, MARGEM + 16 + colunaLargura + 16, yGrid, rotulo2, valor2);
    yGrid -= alturaLinhaGrid;
  }

  y -= alturaCaixaGrid + 22;

  // ===== Descrição =====
  y = desenharSecaoTexto(page, fonte, fonteNegrito, y, "DESCRIÇÃO", dados.descricao || "Sem descrição informada.");
  y -= 18;

  // ===== Relatório técnico =====
  y = desenharSecaoTexto(page, fonte, fonteNegrito, y, "RELATÓRIO TÉCNICO", dados.relatorioTecnico || "—", Math.max(y - 175, 170));

  // ===== Assinaturas =====
  const yAssinatura = 130;
  const larguraColuna = LARGURA_UTIL / 2 - 14;

  await desenharAssinatura(pdfDoc, page, fonte, fonteNegrito, {
    x: MARGEM,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Cliente",
    nome: dados.nomeSignatarioCliente || dados.nomeCliente,
    assinaturaBase64: dados.assinaturaClienteBase64,
    dataAssinatura: dados.dataAssinaturaCliente,
  });

  await desenharAssinatura(pdfDoc, page, fonte, fonteNegrito, {
    x: MARGEM + larguraColuna + 28,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Consultor",
    nome: dados.nomeFuncionario,
    assinaturaBase64: dados.assinaturaFuncionarioBase64,
    dataAssinatura: null,
  });

  // Rodapé
  const rodape = `Documento gerado eletronicamente pelo NorteSys OS em ${new Date().toLocaleString("pt-BR")}`;
  const rodapeLargura = fonte.widthOfTextAtSize(rodape, 7.5);
  page.drawText(rodape, {
    x: (LARGURA_PAGINA - rodapeLargura) / 2,
    y: 34,
    size: 7.5,
    font: fonte,
    color: CINZA_LABEL,
  });

  return pdfDoc.save();
}

function desenharCelula(
  page: PDFPage,
  //fonte: PDFFont,
  fonteNegrito: PDFFont,
  x: number,
  y: number,
  rotulo: string,
  valor: string
) {
  page.drawText(rotulo, { x, y, size: 8, font: fonteNegrito, color: CINZA_LABEL });
  const valorExibido = valor.length > 46 ? valor.slice(0, 43) + "…" : valor;
  page.drawText(valorExibido, { x, y: y - 15, size: 11, font: fonteNegrito, color: CINZA_ESCURO });
}

/**
 * Desenha um título de seção (verde) + o texto com quebra de linha automática.
 * Se `alturaMinimaRestante` for passado, o texto é cortado (com reticências)
 * pra nunca invadir a área reservada das assinaturas.
 */
function desenharSecaoTexto(
  page: PDFPage,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  yInicial: number,
  titulo: string,
  texto: string,
  limiteInferior = 170
): number {
  let y = yInicial;
  page.drawText(titulo, { x: MARGEM, y, size: 10.5, font: fonteNegrito, color: VERDE_ESCURO });
  y -= 6;
  page.drawLine({ start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA_UTIL, y }, thickness: 0.75, color: CINZA_BORDA });
  y -= 16;

  const linhas = quebrarLinhas(texto, fonte, 10, LARGURA_UTIL);
  for (const linha of linhas) {
    if (y < limiteInferior) {
      page.drawText("…", { x: MARGEM, y, size: 10, font: fonte, color: CINZA_TEXTO });
      y -= 14;
      break;
    }
    page.drawText(linha, { x: MARGEM, y, size: 10, font: fonte, color: CINZA_TEXTO });
    y -= 14;
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

  // Sem caixa ao redor — só a assinatura "flutuando" acima da linha, no
  // mesmo espírito visual de um DocuSign/Clicksign: mais limpo, sem parecer
  // um formulário impresso preenchido à mão.
  if (assinaturaBase64) {
    try {
      const png = await pdfDoc.embedPng(base64ParaUint8Array(assinaturaBase64));
      const alturaMax = 44;
      const escala = Math.min(largura / png.width, alturaMax / png.height);
      const largImg = png.width * escala;
      const altImg = png.height * escala;
      page.drawImage(png, {
        x: x + (largura - largImg) / 2,
        y: y + 30,
        width: largImg,
        height: altImg,
      });
    } catch {
      // assinatura em formato inesperado — segue sem travar a geração do PDF
    }
  }

  // Linha fina na cor da marca, em vez de uma caixa fechada
  page.drawLine({ start: { x, y: y + 22 }, end: { x: x + largura, y: y + 22 }, thickness: 1.2, color: VERDE });

  const rotuloLargura = fonteNegrito.widthOfTextAtSize(rotulo, 10.5);
  page.drawText(rotulo, { x: x + (largura - rotuloLargura) / 2, y: y + 8, size: 10.5, font: fonteNegrito, color: VERDE_ESCURO });

  const nomeExibido = nome.length > 38 ? nome.slice(0, 35) + "…" : nome;
  const nomeLargura = fonte.widthOfTextAtSize(nomeExibido, 8.5);
  page.drawText(nomeExibido, { x: x + (largura - nomeLargura) / 2, y: y - 6, size: 8.5, font: fonte, color: CINZA_LABEL });

  if (dataAssinatura) {
    const texto = `Assinado em ${new Date(dataAssinatura).toLocaleString("pt-BR")}`;
    const textoLargura = fonte.widthOfTextAtSize(texto, 7.5);
    page.drawText(texto, { x: x + (largura - textoLargura) / 2, y: y - 17, size: 7.5, font: fonte, color: CINZA_LABEL });
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
