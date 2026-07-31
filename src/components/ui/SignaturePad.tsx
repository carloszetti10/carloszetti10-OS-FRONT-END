import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eraser, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "./Button";

export interface SignaturePadHandle {
  /** Devolve a assinatura como base64 PNG (sem o prefixo "data:image/png;base64,"),
   *  ou null se nada foi desenhado ainda. */
  obterBase64: () => string | null;
  limpar: () => void;
  estaVazio: () => boolean;
}

interface SignaturePadProps {
  altura?: number;
}

/**
 * Campo de assinatura por toque/mouse/caneta (canvas), funciona em
 * celular, tablet e computador — não depende de nenhuma lib externa.
 * Usa Pointer Events, que unifica mouse/touch/caneta numa API só.
 *
 * Tem um modo "expandido" (tela cheia) pra facilitar assinar num celular
 * ou tablet: o campo normal é pequeno pra caber no formulário, mas na
 * hora de assinar de verdade é bem mais prático ter mais espaço.
 *
 * IMPORTANTE: ao entrar/sair do modo expandido a estrutura da tela muda
 * (vira um overlay em tela cheia), então o React desmonta o <canvas>
 * pequeno e monta um <canvas> NOVO pro modo grande (e vice-versa). Por
 * isso o ajuste de resolução/DPI é feito por uma callback ref (definirCanvasRef),
 * que roda de novo toda vez que um canvas novo é montado — e não por um
 * useEffect de dependência vazia, que rodaria só uma vez e deixaria o
 * canvas novo com a resolução errada (foi o que causava o traço saindo
 * deslocado do ponto tocado ao expandir).
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ altura = 180 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const desenhandoRef = useRef(false);
    const temTracoRef = useRef(false);
    const [temTraco, setTemTraco] = useState(false);
    const [expandido, setExpandido] = useState(false);
    // Guarda o desenho já feito quando o canvas precisa ser recriado (ao
    // entrar/sair da tela cheia) — sem isso, o traço se perderia, já que o
    // canvas novo nasce em branco.
    const imagemSalvaRef = useRef<string | null>(null);

    // Ajusta a resolução do canvas pro devicePixelRatio (fica nítido em telas
    // retina) e alinha 1:1 com o tamanho real renderizado — é isso que garante
    // que o traço saia exatamente onde o dedo/caneta tocou. Roda toda vez que
    // o elemento muda de tamanho (resize) e também assim que um canvas novo é montado.
    const configurarCanvas = useCallback((canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f1713";

      if (imagemSalvaRef.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = imagemSalvaRef.current;
      }
    }, []);

    // Callback ref em vez de useEffect(..., []): dispara de novo toda vez que
    // o <canvas> é (re)montado, não só na primeira vez.
    const definirCanvasRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        resizeObserverRef.current?.disconnect();
        canvasRef.current = node;
        if (!node) return;

        configurarCanvas(node);
        const observer = new ResizeObserver(() => configurarCanvas(node));
        observer.observe(node);
        resizeObserverRef.current = observer;
      },
      [configurarCanvas]
    );

    function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function aoIniciar(e: React.PointerEvent<HTMLCanvasElement>) {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      desenhandoRef.current = true;
      const { x, y } = posicao(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    function aoMover(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!desenhandoRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = posicao(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!temTracoRef.current) {
        temTracoRef.current = true;
        setTemTraco(true);
      }
    }

    function aoSoltar() {
      desenhandoRef.current = false;
    }

    function limpar() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      temTracoRef.current = false;
      setTemTraco(false);
      imagemSalvaRef.current = null;
    }

    // Chamado antes de trocar entre o campo normal e a tela cheia — salva o
    // que já foi desenhado (o canvas atual vai ser desmontado e um novo
    // canvas em branco vai entrar no lugar).
    function alternarExpandido(valor: boolean) {
      const canvas = canvasRef.current;
      imagemSalvaRef.current = canvas && temTracoRef.current ? canvas.toDataURL("image/png") : null;
      setExpandido(valor);
    }

    useImperativeHandle(ref, () => ({
      obterBase64: () => {
        if (!temTracoRef.current || !canvasRef.current) return null;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        return dataUrl.replace(/^data:image\/png;base64,/, "");
      },
      limpar,
      estaVazio: () => !temTracoRef.current,
    }));

    const canvasEl = (
      <canvas
        ref={definirCanvasRef}
        className="h-full w-full touch-none"
        onPointerDown={aoIniciar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerLeave={aoSoltar}
      />
    );

    // Modo expandido: assinatura em tela cheia (melhor pra assinar com o
    // dedo num celular ou tablet, sem o campo pequeno atrapalhar o traço).
    if (expandido) {
      return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-white p-4 dark:bg-neutral-950">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Assine com o dedo ou caneta
            </p>
            <button
              type="button"
              onClick={() => alternarExpandido(false)}
              aria-label="Fechar tela cheia"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950">
            {!temTraco && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-300">
                Assine aqui
              </span>
            )}
            {canvasEl}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={!temTraco}>
              <Eraser className="h-4 w-4" /> Limpar
            </Button>
            <Button type="button" className="flex-1" onClick={() => alternarExpandido(false)}>
              <Minimize2 className="h-4 w-4" /> Concluir assinatura
            </Button>
          </div>
        </div>,
        document.body
      );
    }

    return (
      <div className="space-y-2">
        <div
          className="relative overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950"
          style={{ height: altura }}
        >
          {!temTraco && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-300">
              Assine aqui
            </span>
          )}
          {canvasEl}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={!temTraco}>
            <Eraser className="h-4 w-4" /> Limpar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => alternarExpandido(true)}>
            <Maximize2 className="h-4 w-4" /> Expandir
          </Button>
        </div>
      </div>
    );
  }
);
SignaturePad.displayName = "SignaturePad";
