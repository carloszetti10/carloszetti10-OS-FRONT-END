import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser } from "lucide-react";
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
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ altura = 180 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const desenhandoRef = useRef(false);
    const temTracoRef = useRef(false);
    const [temTraco, setTemTraco] = useState(false);

    // Ajusta a resolução do canvas pro devicePixelRatio (fica nítido em telas retina)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ajustarTamanho = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        ctx?.scale(dpr, dpr);
        if (ctx) {
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#0f1713";
        }
      };
      ajustarTamanho();
      window.addEventListener("resize", ajustarTamanho);
      return () => window.removeEventListener("resize", ajustarTamanho);
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
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none"
            onPointerDown={aoIniciar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerLeave={aoSoltar}
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={limpar} disabled={!temTraco}>
          <Eraser className="h-4 w-4" /> Limpar
        </Button>
      </div>
    );
  }
);
SignaturePad.displayName = "SignaturePad";
