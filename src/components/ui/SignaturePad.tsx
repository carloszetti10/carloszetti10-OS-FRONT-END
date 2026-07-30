import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ altura = 180 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const desenhandoRef = useRef(false);
    const temTracoRef = useRef(false);
    const [temTraco, setTemTraco] = useState(false);
    const [expandido, setExpandido] = useState(false);

    // Ajusta a resolução do canvas pro devicePixelRatio (fica nítido em telas
    // retina) e preserva o traço já desenhado sempre que o canvas muda de
    // tamanho — tanto por resize da janela quanto por entrar/sair do modo
    // expandido (que troca o tamanho do canvas sem disparar "resize" da window).
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ajustarTamanho = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const desenhoAnterior = temTracoRef.current ? canvas.toDataURL("image/png") : null;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f1713";
        if (desenhoAnterior) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
          img.src = desenhoAnterior;
        }
      };
      ajustarTamanho();
      const observer = new ResizeObserver(ajustarTamanho);
      observer.observe(canvas);
      return () => observer.disconnect();
    }, []);

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
        ref={canvasRef}
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
              onClick={() => setExpandido(false)}
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
            <Button type="button" className="flex-1" onClick={() => setExpandido(false)}>
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
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpandido(true)}>
            <Maximize2 className="h-4 w-4" /> Expandir
          </Button>
        </div>
      </div>
    );
  }
);
SignaturePad.displayName = "SignaturePad";
