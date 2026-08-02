import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eraser, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "./Button";

export interface SignaturePadHandle {
  obterBase64: () => string | null;
  limpar: () => void;
  estaVazio: () => boolean;
}

interface SignaturePadProps {
  altura?: number;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ altura = 180 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const desenhandoRef = useRef(false);
    const temTracoRef = useRef(false);
    
    const imagemBase64Ref = useRef<string | null>(null);
    const tamanhoAnteriorRef = useRef({ width: 0, height: 0 });

    const [temTraco, setTemTraco] = useState(false);
    const [expandido, setExpandido] = useState(false);
    // Guarda o desenho já feito quando o canvas precisa ser recriado (ao
    // entrar/sair da tela cheia) — sem isso, o traço se perderia, já que o
    // canvas novo nasce em branco.
    const imagemSalvaRef = useRef<string | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ajustarTamanho = () => {
        requestAnimationFrame(() => {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) return;

          if (
            rect.width === tamanhoAnteriorRef.current.width &&
            rect.height === tamanhoAnteriorRef.current.height
          ) {
            return;
          }

          tamanhoAnteriorRef.current = { width: rect.width, height: rect.height };

          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.scale(dpr, dpr);
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#0f1713";

          // Se já existe uma imagem salva, desenha ela de volta no novo canvas
          if (imagemBase64Ref.current) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = imagemBase64Ref.current;
          }
        });
      };

      ajustarTamanho();

      const observer = new ResizeObserver(ajustarTamanho);
      observer.observe(canvas);

      return () => observer.disconnect();
    }, [expandido]);

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
      if (!desenhandoRef.current) return;
      desenhandoRef.current = false;

      if (canvasRef.current && temTracoRef.current) {
        imagemBase64Ref.current = canvasRef.current.toDataURL("image/png");
      }
    }

    function limpar() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      temTracoRef.current = false;
      imagemBase64Ref.current = null;
      tamanhoAnteriorRef.current = { width: 0, height: 0 };
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
        if (!temTracoRef.current) return null;

        const dataUrl = imagemBase64Ref.current || canvasRef.current?.toDataURL("image/png");
        if (!dataUrl) return null;

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