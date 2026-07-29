import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { LOGO_NORTESYS_BASE64 } from "@/assets/logoNortesysBase64";
import { base64ParaUint8Array } from "./gerarPdfOs";

export interface FotoAtendimento {
  /** data URL completa (ex.: "data:image/jpeg;base64,...") — vem direto do <input type="file"> */
  dataUrl: string;
}

export interface DadosPdfFotos {
  idOs: number;
  tituloOs: string;
  nomeCliente: string;
  fotos: FotoAtendimento[];
}

const VERDE = rgb(0.086, 0.643, 0.42);
const VERDE_ESCURO = rgb(0.07, 0.31, 0.24);
const CINZA_ESCURO = rgb(0.11, 0.14, 0.13);
const CINZA_LABEL = rgb(0.55, 0.58, 0.57);
const CINZA_BORDA = rgb(0.86, 0.88, 0.87);

const MARGEM = 40;
const LARGURA_PAGINA = 595.28;
const ALTURA_PAGINA = 841.89;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const FOTOS_POR_LINHA = 2;
const LINHAS_POR_PAGINA = 3;
const FOTOS_POR_PAGINA = FOTOS_POR_LINHA * LINHAS_POR_PAGINA;

/**
 * Monta o PDF de "fotos do atendimento" (número da OS + as fotos tiradas
 * pelo consultor), em grade de 2x3 por página, paginando quando precisar.
 * Roda 100% no navegador (pdf-lib).
 */
export async function gerarPdfFotos(dados: DadosPdfFotos): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonte = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdfDoc.embedPng(base64ParaUint8Array(LOGO_NORTESYS_BASE64));

  const totalPaginas = Math.max(1, Math.ceil(dados.fotos.length / FOTOS_POR_PAGINA));

  for (let numeroPagina = 0; numeroPagina < totalPaginas; numeroPagina++) {
    const page = pdfDoc.addPage([LARGURA_PAGINA, ALTURA_PAGINA]);
    let y = desenharCabecalho(page, fonte, fonteNegrito, logo, dados, numeroPagina + 1, totalPaginas);

    const fotosDaPagina = dados.fotos.slice(
      numeroPagina * FOTOS_POR_PAGINA,
      numeroPagina * FOTOS_POR_PAGINA + FOTOS_POR_PAGINA
    );

    const larguraCelula = (LARGURA_UTIL - 14) / FOTOS_POR_LINHA;
    const alturaCelula = 210;

    for (let i = 0; i < fotosDaPagina.length; i++) {
      const coluna = i % FOTOS_POR_LINHA;
      const linha = Math.floor(i / FOTOS_POR_LINHA);
      const x = MARGEM + coluna * (larguraCelula + 14);
      const yCelula = y - linha * (alturaCelula + 16) - alturaCelula;

      await desenharFoto(pdfDoc, page, fotosDaPagina[i], x, yCelula, larguraCelula, alturaCelula);

      const numeroFoto = numeroPagina * FOTOS_POR_PAGINA + i + 1;
      const legenda = `Foto ${numeroFoto}`;
      const legendaLargura = fonte.widthOfTextAtSize(legenda, 8.5);
      page.drawText(legenda, {
        x: x + (larguraCelula - legendaLargura) / 2,
        y: yCelula - 14,
        size: 8.5,
        font: fonte,
        color: CINZA_LABEL,
      });
    }

    if (fotosDaPagina.length === 0) {
      page.drawText("Nenhuma foto registrada.", { x: MARGEM, y: y - 20, size: 11, font: fonte, color: CINZA_LABEL });
    }
  }

  return pdfDoc.save();
}

function desenharCabecalho(
  page: PDFPage,
  fonte: PDFFont,
  fonteNegrito: PDFFont,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  dados: DadosPdfFotos,
  paginaAtual: number,
  totalPaginas: number
): number {
  let y = ALTURA_PAGINA - 40;

  const logoLargura = 90;
  const logoAltura = (logo.height / logo.width) * logoLargura;
  page.drawImage(logo, { x: MARGEM, y: y - logoAltura + 6, width: logoLargura, height: logoAltura });

  const codigoOs = `Nº ${String(dados.idOs).padStart(6, "0")}`;
  const codigoLargura = fonteNegrito.widthOfTextAtSize(codigoOs, 12);
  page.drawText(codigoOs, { x: LARGURA_PAGINA - MARGEM - codigoLargura, y: y - 4, size: 12, font: fonteNegrito, color: VERDE_ESCURO });

  const rotulo = "FOTOS DO ATENDIMENTO";
  const rotuloLargura = fonte.widthOfTextAtSize(rotulo, 9);
  page.drawText(rotulo, { x: LARGURA_PAGINA - MARGEM - rotuloLargura, y: y - 18, size: 9, font: fonte, color: CINZA_LABEL });

  y -= Math.max(logoAltura + 4, 30);
  page.drawLine({ start: { x: MARGEM, y }, end: { x: LARGURA_PAGINA - MARGEM, y }, thickness: 2, color: VERDE });
  y -= 22;

  page.drawText(dados.tituloOs, { x: MARGEM, y, size: 13, font: fonteNegrito, color: CINZA_ESCURO });
  y -= 16;
  page.drawText(dados.nomeCliente, { x: MARGEM, y, size: 9.5, font: fonte, color: CINZA_LABEL });
  y -= 10;

  if (totalPaginas > 1) {
    const paginacao = `Página ${paginaAtual} de ${totalPaginas}`;
    const paginacaoLargura = fonte.widthOfTextAtSize(paginacao, 8);
    page.drawText(paginacao, {
      x: LARGURA_PAGINA - MARGEM - paginacaoLargura,
      y: 24,
      size: 8,
      font: fonte,
      color: CINZA_LABEL,
    });
  }

  return y - 20;
}

async function desenharFoto(
  pdfDoc: PDFDocument,
  page: PDFPage,
  foto: FotoAtendimento,
  x: number,
  y: number,
  largura: number,
  altura: number
) {
  page.drawRectangle({ x, y, width: largura, height: altura, borderColor: CINZA_BORDA, borderWidth: 1 });

  try {
    const bytes = base64ParaUint8Array(foto.dataUrl);
    const ehPng = foto.dataUrl.startsWith("data:image/png");
    const imagem = ehPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

    const padding = 8;
    const larguraDisponivel = largura - padding * 2;
    const alturaDisponivel = altura - padding * 2;
    const escala = Math.min(larguraDisponivel / imagem.width, alturaDisponivel / imagem.height);
    const largImg = imagem.width * escala;
    const altImg = imagem.height * escala;

    page.drawImage(imagem, {
      x: x + (largura - largImg) / 2,
      y: y + (altura - altImg) / 2,
      width: largImg,
      height: altImg,
    });
  } catch {
    // formato de imagem inesperado — segue sem travar a geração do PDF
  }
}
