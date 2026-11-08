export function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Full-screen confetti burst on a throw-away canvas. Skipped for reduced-motion users. */
export function burstConfetti(durationMs = 2600): void {
    if (typeof document === "undefined" || prefersReducedMotion()) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = `position:fixed;inset:0;width:${w}px;height:${h}px;pointer-events:none;z-index:9999`;
    document.body.appendChild(canvas);
    ctx.scale(dpr, dpr);

    const colors = ["#60a5fa", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#f87171"];
    const parts = Array.from({ length: 150 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const speed = 8 + Math.random() * 11;
        return {
            x: w / 2,
            y: h * 0.45,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 6,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    });

    const start = performance.now();
    const frame = (now: number) => {
        const t = now - start;
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - durationMs * 0.6) / (durationMs * 0.4));
        for (const p of parts) {
            p.vy += 0.28;
            p.vx *= 0.992;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        }
        if (t < durationMs) requestAnimationFrame(frame);
        else canvas.remove();
    };
    requestAnimationFrame(frame);
}

export interface CardTheme {
    id: string;
    name: string;
    colors: [string, string, string];
    accent: string;
}

export const CARD_THEMES: CardTheme[] = [
    { id: "royal", name: "Royal", colors: ["#1e1b4b", "#4338ca", "#7e22ce"], accent: "#fbbf24" },
    { id: "forest", name: "Forest", colors: ["#022c22", "#047857", "#0f766e"], accent: "#fde68a" },
    { id: "sunrise", name: "Sunrise", colors: ["#7c2d12", "#e11d48", "#f59e0b"], accent: "#ffffff" },
    { id: "midnight", name: "Midnight", colors: ["#020617", "#0f172a", "#1e293b"], accent: "#38bdf8" },
];

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/** Draws a 1080x1920 (WhatsApp-status / Stories) PNG of a verse. */
export function renderVerseCard(opts: { reference: string; version: string; text: string; theme: CardTheme }): Promise<Blob> {
    const W = 1080;
    const H = 1920;
    const { theme } = opts;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas not supported"));

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, theme.colors[0]);
    bg.addColorStop(0.55, theme.colors[1]);
    bg.addColorStop(1, theme.colors[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 700);
    glow.addColorStop(0, "rgba(255,255,255,0.22)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.1 + rand() * 0.35})`;
        ctx.beginPath();
        ctx.arc(rand() * W, rand() * H, 1 + rand() * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `700 30px ${SANS}`;
    ctx.fillText("LIFE GATE MINISTRIES WORLDWIDE", W / 2, 150);

    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.9;
    ctx.font = `700 260px ${SERIF}`;
    ctx.fillText("\u201C", W / 2, 520);
    ctx.globalAlpha = 1;

    const maxW = 840;
    let size = 80;
    let lines: string[] = [];
    for (; size >= 36; size -= 4) {
        ctx.font = `italic ${size}px ${SERIF}`;
        lines = wrap(ctx, opts.text, maxW);
        if (lines.length * size * 1.4 <= 820) break;
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = `italic ${size}px ${SERIF}`;
    const lineH = size * 1.4;
    let y = 640 + (820 - lines.length * lineH) / 2 + size;
    for (const l of lines) {
        ctx.fillText(l, W / 2, y);
        y += lineH;
    }

    ctx.fillStyle = theme.accent;
    ctx.fillRect(W / 2 - 60, 1560, 120, 4);
    ctx.font = `700 54px ${SERIF}`;
    ctx.fillText(opts.reference, W / 2, 1650);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `600 32px ${SANS}`;
    ctx.fillText(opts.version, W / 2, 1708);
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText("Sunday School", W / 2, 1830);

    return new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/png");
    });
}

/** Native share sheet with the image where supported, otherwise a plain download. */
export async function shareOrDownload(blob: Blob, filename: string, text: string): Promise<"shared" | "downloaded" | "cancelled"> {
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], text });
            return "shared";
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
        }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "downloaded";
}
