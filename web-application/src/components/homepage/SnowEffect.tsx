"use client";

import { useEffect, useRef } from "react";

const SnowEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const circlesRef = useRef<any[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let handleResize: () => void;

    timer = setTimeout(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      function getHeight() {
        const body = document.body;
        const htmlElement = document.documentElement;
        return Math.max(
          body.scrollHeight,
          body.offsetHeight,
          htmlElement.clientHeight,
          htmlElement.scrollHeight,
          htmlElement.offsetHeight
        );
      }

      function startAnimation() {
        if (!canvasRef.current || !ctx) return;

        const CANVAS_WIDTH = window.innerWidth;
        const CANVAS_HEIGHT = getHeight();

        const MIN = 0;
        const MAX = CANVAS_WIDTH;

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        canvas.style.height = CANVAS_HEIGHT + "px";

        function clamp(number: number, min = MIN, max = MAX) {
          return Math.max(min, Math.min(number, max));
        }

        function random(factor = 1) {
          return Math.random() * factor;
        }

        class Circle {
          radius = 0;
          x = 0;
          y = 0;
          vx = 0;
          vy = 0;
          ctx: CanvasRenderingContext2D;
          CANVAS_WIDTH: number;
          CANVAS_HEIGHT: number;

          constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
            this.ctx = ctx;
            this.CANVAS_WIDTH = width;
            this.CANVAS_HEIGHT = height;
            this.reset();
          }

          draw() {
            this.ctx.beginPath();
            // Màu trắng với shadow để nổi bật trên nền xám
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 0.5;
            this.ctx.shadowOffsetY = 0.5;
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();
            // Reset shadow
            this.ctx.shadowColor = "transparent";
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
          }

          reset() {
            this.radius = random(2.5);
            this.x = random(this.CANVAS_WIDTH);
            this.y = this.y ? 0 : random(this.CANVAS_HEIGHT);
            this.vx = clamp((Math.random() - 0.5) * 0.4, -0.4, 0.4);
            this.vy = clamp(random(1.5), 0.1, 0.8) * this.radius * 0.5;
          }
        }

        // Tạo circles mới nếu chưa có
        if (circlesRef.current.length === 0) {
          for (let i = 0; i < 300; i++) {
            circlesRef.current.push(new Circle(ctx, CANVAS_WIDTH, CANVAS_HEIGHT));
          }
        } else {
          // Cập nhật kích thước cho circles hiện có
          circlesRef.current.forEach((circle) => {
            circle.CANVAS_WIDTH = CANVAS_WIDTH;
            circle.CANVAS_HEIGHT = CANVAS_HEIGHT;
          });
        }

        function clearCanvas() {
          if (!ctx) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        function animate() {
          if (!canvasRef.current || !ctx) return;

          clearCanvas();

          const canvasOffset = {
            x0: 0,
            y0: 0,
            x1: canvas.width,
            y1: canvas.height,
          };

          circlesRef.current.forEach((e) => {
            if (
              e.x <= canvasOffset.x0 ||
              e.x >= canvasOffset.x1 ||
              e.y <= canvasOffset.y0 ||
              e.y >= canvasOffset.y1
            ) {
              e.reset();
            }

            e.x = e.x + e.vx;
            e.y = e.y + e.vy;
            e.draw();
          });

          animationRef.current = requestAnimationFrame(animate);
        }

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animate();
      }

      startAnimation();

      handleResize = () => {
        startAnimation();
      };

      window.addEventListener("resize", handleResize);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 99,
        pointerEvents: "none",
        width: "100%",
      }}
    />
  );
};

export default SnowEffect;

