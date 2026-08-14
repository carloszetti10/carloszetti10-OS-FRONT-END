import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

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

// Espaço reservado no rodapé — nenhum conteúdo pode invadir essa faixa.
const RODAPE_ALTURA = 52;
// Topo livre em páginas de continuação (sem o cabeçalho com logo).
const TOPO_PAGINA_CONTINUACAO = ALTURA_PAGINA - 56;

/** "Cursor" de escrita: página atual + posição Y. Fica mais fácil de passar
 *  adiante entre as funções de desenho do que ficar repassando (page, y). */
interface ContextoPdf {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
}

/**
 * Monta o PDF da OS com um layout próprio (não replica o modelo .docx):
 * cabeçalho com logo + título + código da OS, um bloco de dados em
 * "cards" (cliente/documento/tipo/datas), descrição, relatório técnico e,
 * por fim, as assinaturas — Cliente à esquerda, Consultor à direita.
 *
 * Suporta múltiplas páginas: se a descrição e/ou o relatório técnico forem
 * longos, o texto continua automaticamente em novas páginas (nunca é
 * cortado/truncado), e as assinaturas ficam sempre juntas — se não couber
 * espaço suficiente pra elas na página atual, pulam inteiras pra próxima.
 *
 * Roda 100% no navegador (pdf-lib).
 */
export async function gerarPdfOs(dados: DadosPdfOs): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdfDoc.embedPng(await carregarLogoPdf());

  const ctx: ContextoPdf = {
    pdfDoc,
    page: pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]),
    y: 0,
  };

  desenharCabecalho(ctx, fonte, fonteNegrito, logo, dados);
  desenharGridDados(ctx, fonteNegrito, dados);

  desenharSecaoTexto(ctx, fonte, fonteNegrito, "DESCRIÇÃO", dados.descricao || "Sem descrição informada.");
  desenharSecaoTexto(ctx, fonte, fonteNegrito, "RELATÓRIO TÉCNICO", dados.relatorioTecnico || "—");

  // ===== Assinaturas — reservam o próprio espaço, nunca são cortadas =====
  const ALTURA_BLOCO_ASSINATURA = 95; // do topo (imagem) até a data, com folga
  garantirEspaco(ctx, ALTURA_BLOCO_ASSINATURA);

  const yAssinatura = ctx.y - 74; // mantém a mesma geometria relativa que desenharAssinatura já espera
  const larguraColuna = LARGURA_UTIL / 2 - 14;

  await desenharAssinatura(pdfDoc, ctx.page, fonte, fonteNegrito, {
    x: MARGEM,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Cliente",
    nome: dados.nomeSignatarioCliente || dados.nomeCliente,
    assinaturaBase64: dados.assinaturaClienteBase64,
    dataAssinatura: dados.dataAssinaturaCliente,
  });

  await desenharAssinatura(pdfDoc, ctx.page, fonte, fonteNegrito, {
    x: MARGEM + larguraColuna + 28,
    y: yAssinatura,
    largura: larguraColuna,
    rotulo: "Consultor",
    nome: dados.nomeFuncionario,
    assinaturaBase64: dados.assinaturaFuncionarioBase64,
    dataAssinatura: null,
  });

  desenharRodapeEmTodasPaginas(pdfDoc, fonte);

  return pdfDoc.save();
}

/** Cria uma página nova e reposiciona o cursor no topo dela. */
function novaPagina(ctx: ContextoPdf): void {
  ctx.page = ctx.pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]);
  ctx.y = TOPO_PAGINA_CONTINUACAO;
}

/** Se não sobrar `altura` pontos antes do rodapé, pula pra uma página nova. */
function garantirEspaco(ctx: ContextoPdf, altura: number, limiteInferior = RODAPE_ALTURA): void {
  if (ctx.y - altura < limiteInferior) {
    novaPagina(ctx);
  }
}

function desenharCabecalho(
  ctx: ContextoPdf,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  dados: DadosPdfOs
): void {
  let y = ALTURA_PAGINA - 44;
  const page = ctx.page;

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
  page.drawLine({ start: { x: MARGEM, y }, end: { x: LARGURA_PAGINA - MARGEM, y }, thickness: 2, color: VERDE });
  y -= 26;

  page.drawText(dados.tituloOs || "Ordem de Serviço", {
    x: MARGEM,
    y,
    size: 16,
    font: fonteNegrito,
    color: CINZA_ESCURO,
  });
  y -= 28;

  ctx.y = y;
}

function desenharGridDados(ctx: ContextoPdf, fonteNegrito: PDFFont, dados: DadosPdfOs): void {
  const { data: dataInicio, hora: horaInicio } = separarDataHora(dados.dataHoraInicio);
  const { data: dataFim, hora: horaFim } = separarDataHora(dados.dataHoraFim);

  const linhasGrid: [string, string, string, string][] = [
    ["CLIENTE", dados.nomeCliente || "—", "DOCUMENTO", dados.documentoCliente || "—"],
    ["TIPO DE ATENDIMENTO", dados.nomeTipoAtendimento || "—", "CONSULTOR RESPONSÁVEL", dados.nomeFuncionario || "—"],
    ["DATA/HORA DE INÍCIO", dataInicio ? `${dataInicio} às ${horaInicio || "—"}` : "—", "DATA/HORA DE TÉRMINO", dataFim ? `${dataFim} às ${horaFim || "—"}` : "—"],
  ];

  const alturaLinhaGrid = 40;
  const alturaCaixaGrid = linhasGrid.length * alturaLinhaGrid + 20;

  // Grid não paginado internamente (sempre tem tamanho fixo) — só garante
  // que, se estiver perto do fim da página, ela inteira pula pra próxima.
  garantirEspaco(ctx, alturaCaixaGrid + 22);

  const colunaLargura = (LARGURA_UTIL - 16) / 2;
  const page = ctx.page;

  page.drawRectangle({
    x: MARGEM,
    y: ctx.y - alturaCaixaGrid,
    width: LARGURA_UTIL,
    height: alturaCaixaGrid,
    color: CINZA_FUNDO,
    borderColor: CINZA_BORDA,
    borderWidth: 1,
  });

  let yGrid = ctx.y - 22;
  for (const [rotulo1, valor1, rotulo2, valor2] of linhasGrid) {
    desenharCelula(page, fonteNegrito, MARGEM + 16, yGrid, rotulo1, valor1);
    desenharCelula(page, fonteNegrito, MARGEM + 16 + colunaLargura + 16, yGrid, rotulo2, valor2);
    yGrid -= alturaLinhaGrid;
  }

  ctx.y -= alturaCaixaGrid + 22;
}

function desenharCelula(page: PDFPage, fonteNegrito: PDFFont, x: number, y: number, rotulo: string, valor: string) {
  page.drawText(rotulo, { x, y, size: 8, font: fonteNegrito, color: CINZA_LABEL });
  const valorExibido = valor.length > 46 ? valor.slice(0, 43) + "…" : valor;
  page.drawText(valorExibido, { x, y: y - 15, size: 11, font: fonteNegrito, color: CINZA_ESCURO });
}

/**
 * Desenha um título de seção (verde) + o texto com quebra de linha
 * automática. Se o texto não couber no espaço restante da página, o
 * desenho continua sozinho em quantas páginas novas forem necessárias —
 * sem truncar nada.
 */
function desenharSecaoTexto(ctx: ContextoPdf, fonte: PDFFont, fonteNegrito: PDFFont, titulo: string, texto: string): void {
  // Reserva espaço pro título + a linha divisória + pelo menos 1 linha de
  // texto, senão já pula de página ANTES do título (evita título "órfão"
  // sozinho no fim de uma página).
  garantirEspaco(ctx, 16 + 14);

  ctx.page.drawText(titulo, { x: MARGEM, y: ctx.y, size: 10.5, font: fonteNegrito, color: VERDE_ESCURO });
  ctx.y -= 6;
  ctx.page.drawLine({ start: { x: MARGEM, y: ctx.y }, end: { x: MARGEM + LARGURA_UTIL, y: ctx.y }, thickness: 0.75, color: CINZA_BORDA });
  ctx.y -= 16;

  const paragrafos = texto.replace(/\r/g, "").split(/\n/);
  paragrafos.forEach((paragrafo, indice) => {
    // Linha em branco digitada pelo técnico (parágrafo) = respiro extra no PDF.
    if (paragrafo.trim() === "") {
      if (indice > 0 && indice < paragrafos.length - 1) {
        garantirEspaco(ctx, 8);
        ctx.y -= 8;
      }
      return;
    }

    const linhas = quebrarLinhas(paragrafo, fonte, 10, LARGURA_UTIL);
    for (const linha of linhas) {
      garantirEspaco(ctx, 14);
      ctx.page.drawText(linha, { x: MARGEM, y: ctx.y, size: 10, font: fonte, color: CINZA_TEXTO });
      ctx.y -= 14;
    }
  });

  ctx.y -= 18; // respiro depois da seção
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

/** Desenha o rodapé em TODAS as páginas geradas, já com "Página X de Y" quando há mais de uma. */
function desenharRodapeEmTodasPaginas(pdfDoc: PDFDocument, fonte: PDFFont): void {
  const paginas = pdfDoc.getPages();
  const timestamp = new Date().toLocaleString("pt-BR");

  paginas.forEach((pagina, indice) => {
    const rodape =
      paginas.length > 1
        ? `Documento gerado eletronicamente pelo NorteSys OS em ${timestamp} — Página ${indice + 1} de ${paginas.length}`
        : `Documento gerado eletronicamente pelo NorteSys OS em ${timestamp}`;
    const rodapeLargura = fonte.widthOfTextAtSize(rodape, 7.5);
    pagina.drawText(rodape, {
      x: (LARGURA_PAGINA - rodapeLargura) / 2,
      y: 34,
      size: 7.5,
      font: fonte,
      color: CINZA_LABEL,
    });
  });
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

/**
 * Busca o PNG da logo usada no cabeçalho dos PDFs (`public/logo-pdf.png`).
 * É a logomarca antiga da NorteSys — mantida propositalmente nos documentos
 * gerados, mesmo com a marca do site já atualizada para a nova logo.
 * Carregado como arquivo estático (não em base64) para não inflar o bundle JS.
 */
export async function carregarLogoPdf(): Promise<Uint8Array> {
  const resposta = await fetch("/logo-pdf.png");
  const bytes = await resposta.arrayBuffer();
  return new Uint8Array(bytes);
}

/** base64 -> Uint8Array (aceita string com ou sem o prefixo "data:image/...;base64,") */
export function base64ParaUint8Array(base64: string): Uint8Array {
  const semPrefixo = base64.replace(/^data:.*;base64,/, "");
  const binario = atob(semPrefixo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
