/**
 * ============================================================
 *  ARIA1 — Super Agent Service
 *  Agent autonome IA intégré à ARIA-OS.
 *
 *  Capacités :
 *  - Génération de scripts voice-over (via Gemini SSE)
 *  - Analyse de sources (URL YouTube, articles, texte libre)
 *  - Gestion des quotas (anonymes vs. connectés)
 *  - Suggestions de qualité de code (mode dev)
 *  - Orchestration des services ARIA-OS
 * ============================================================
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { GeminiService } from './gemini.service';
import { ScriptService } from './script.service';
import { ToastService } from './toast.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Aria1TaskType =
  | 'generate-script'
  | 'analyze-source'
  | 'suggest-improvement'
  | 'debug-assist'
  | 'idle';

export type Aria1Status = 'idle' | 'thinking' | 'running' | 'done' | 'error';

export interface Aria1Task {
  id: string;
  type: Aria1TaskType;
  label: string;
  startedAt: Date;
  finishedAt?: Date;
  status: Aria1Status;
  result?: string;
  error?: string;
}

export interface ScriptGenerationParams {
  sourceUrl?: string;
  sourceText?: string;
  intention: string;
  tone: string;
  stance: string;
  duration: string;
}

// ─── Agent Rules (mirrored from AGENTS.md for runtime enforcement) ────────────

const ARIA1_RULES = {
  name: 'ARIA1',
  version: '1.0.0',
  priorities: ['Correctness', 'Simplicity', 'Maintainability', 'Performance'],
  maxAnonymousGenerations: 2,
  quotaWindowHours: 24,
  supportedSourceTypes: ['youtube', 'facebook', 'twitter', 'x', 'article', 'text'],
  outputLanguage: 'fr', // All UI text in French
} as const;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class Aria1Service {

  // ── Dependency Injection ──────────────────────────────────────────────────
  private readonly auth    = inject(AuthService);
  private readonly gemini  = inject(GeminiService);
  private readonly scripts = inject(ScriptService);
  private readonly toast   = inject(ToastService);

  // ── Reactive State ────────────────────────────────────────────────────────

  /** History of all tasks executed in the current session */
  readonly taskHistory = signal<Aria1Task[]>([]);

  /** Currently running task, if any */
  readonly currentTask = signal<Aria1Task | null>(null);

  /** Global agent status */
  readonly status = signal<Aria1Status>('idle');

  /** Live streaming text during generation */
  readonly streamingText = signal<string>('');

  /** Whether ARIA1 is currently processing something */
  readonly isBusy = computed(() => this.status() === 'thinking' || this.status() === 'running');

  /** Number of tasks completed in this session */
  readonly completedCount = computed(() =>
    this.taskHistory().filter(t => t.status === 'done').length
  );

  // ── Public Agent Info ─────────────────────────────────────────────────────

  get agentName(): string { return ARIA1_RULES.name; }
  get agentVersion(): string { return ARIA1_RULES.version; }
  get priorities(): readonly string[] { return ARIA1_RULES.priorities; }

  // ─────────────────────────────────────────────────────────────────────────
  // RULE 1: THINK BEFORE ACTING
  // Validate all preconditions before starting any task.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validates preconditions for a script generation task.
   * Enforces agent rules: auth check, input validation, quota awareness.
   */
  private validateScriptParams(params: ScriptGenerationParams): string | null {
    if (!params.sourceUrl?.trim() && !params.sourceText?.trim()) {
      return 'Une source est requise (URL ou texte).';
    }
    if (!params.intention?.trim()) return 'L\'intention est requise.';
    if (!params.tone?.trim())      return 'Le ton est requis.';
    if (!params.stance?.trim())    return 'Le parti pris est requis.';
    if (!params.duration?.trim())  return 'La durée cible est requise.';
    return null; // ✅ valid
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CAPABILITY: Generate a voice-over script
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * ARIA1 generates a professional voice-over script using Gemini AI.
   *
   * Behavior:
   * - Validates inputs before calling the API (Correctness)
   * - Streams the result token-by-token for live preview (Performance)
   * - Updates task history and reactive state (Maintainability)
   * - Handles errors gracefully without crashing the app (Correctness)
   *
   * @param params   Generation parameters (source, tone, etc.)
   * @param onToken  Optional callback called on each streamed token
   * @returns        The full generated script text, or throws on error
   */
  async generateScript(
    params: ScriptGenerationParams,
    onToken?: (text: string) => void
  ): Promise<{ script: string; type: 'video' | 'article' | 'social' | 'text' }> {

    // ── Step 1: THINK — Validate inputs (RULE 1) ──────────────────────────
    const validationError = this.validateScriptParams(params);
    if (validationError) {
      this.toast.show(validationError, 'error');
      throw new Error(validationError);
    }

    // ── Step 2: Create & track the task ──────────────────────────────────
    const task = this.createTask('generate-script', 'Génération de script voice-over');
    this.status.set('thinking');

    try {
      // ── Step 3: RUN — delegate to GeminiService (RULE 4: minimal changes) ─
      this.status.set('running');
      this.streamingText.set('');

      const result = await this.gemini.analyzeAndGenerateScript(
        params.sourceUrl  ?? '',
        params.sourceText ?? '',
        params.intention,
        params.tone,
        params.stance,
        params.duration,
        (progressText: string) => {
          this.streamingText.set(progressText);
          onToken?.(progressText);
        }
      );

      // ── Step 4: DONE — update state ───────────────────────────────────
      this.finalizeTask(task, 'done', result.script);
      this.status.set('done');
      this.streamingText.set('');

      return result;

    } catch (error: unknown) {
      // ── Step 5: ERROR — handle gracefully, log meaningfully ───────────
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('[ARIA1] generateScript error:', message);
      this.finalizeTask(task, 'error', undefined, message);
      this.status.set('error');
      this.streamingText.set('');
      throw error;

    } finally {
      // Always reset to idle after a short delay so UI can show result
      setTimeout(() => {
        if (this.status() !== 'running') {
          this.status.set('idle');
          this.currentTask.set(null);
        }
      }, 3000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CAPABILITY: Analyze a source URL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * ARIA1 detects the type of a source URL.
   * Returns a human-readable description and the detected source type.
   */
  analyzeSource(url: string): {
    type: 'youtube' | 'social' | 'article' | 'text';
    label: string;
    icon: string;
  } {
    if (!url?.trim()) {
      return { type: 'text', label: 'Texte libre', icon: '📝' };
    }

    const lower = url.toLowerCase();

    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { type: 'youtube', label: 'Vidéo YouTube', icon: '▶️' };
    }
    if (lower.includes('facebook.com')) {
      return { type: 'social', label: 'Publication Facebook', icon: '👥' };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
      return { type: 'social', label: 'Publication X (Twitter)', icon: '🐦' };
    }
    if (lower.includes('instagram.com')) {
      return { type: 'social', label: 'Publication Instagram', icon: '📸' };
    }
    if (lower.includes('tiktok.com')) {
      return { type: 'social', label: 'Vidéo TikTok', icon: '🎵' };
    }

    // Default: treat as a generic article
    return { type: 'article', label: 'Article web', icon: '📰' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CAPABILITY: Extract <script_pro> content from a raw Gemini response
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Extracts the teleprompter-ready script from a raw Gemini response.
   * The teleprompter expects content inside <script_pro>...</script_pro> tags.
   *
   * @param rawText  Full text returned by Gemini
   * @returns        Object with the extracted script and surrounding commentary
   */
  extractScriptPro(rawText: string): {
    scriptContent: string;
    introComment: string;
    tips: string;
    hasScriptTags: boolean;
  } {
    const match = rawText.match(/<script_pro>([\s\S]*?)<\/script_pro>/i);

    if (!match) {
      console.warn('[ARIA1] extractScriptPro: no <script_pro> tags found in response');
      return {
        scriptContent: rawText,
        introComment: '',
        tips: '',
        hasScriptTags: false,
      };
    }

    const scriptContent = match[1].trim();
    const tagStart = rawText.indexOf('<script_pro>');
    const tagEnd   = rawText.indexOf('</script_pro>') + '</script_pro>'.length;

    const introComment = rawText.substring(0, tagStart).trim();
    const tips         = rawText.substring(tagEnd).trim();

    return { scriptContent, introComment, tips, hasScriptTags: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CAPABILITY: Agent self-check
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns ARIA1's current status report.
   * Useful for debugging and for displaying agent info in the UI.
   */
  getStatusReport(): {
    agent: string;
    version: string;
    status: Aria1Status;
    sessionTasks: number;
    completedTasks: number;
    isAuthenticated: boolean;
    isAnonymous: boolean;
  } {
    return {
      agent: this.agentName,
      version: this.agentVersion,
      status: this.status(),
      sessionTasks: this.taskHistory().length,
      completedTasks: this.completedCount(),
      isAuthenticated: !!this.auth.currentUser(),
      isAnonymous: this.auth.isAnonymous(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Creates, registers, and returns a new task */
  private createTask(type: Aria1TaskType, label: string): Aria1Task {
    const task: Aria1Task = {
      id: crypto.randomUUID(),
      type,
      label,
      startedAt: new Date(),
      status: 'running',
    };
    this.currentTask.set(task);
    this.taskHistory.update(history => [task, ...history]);
    return task;
  }

  /** Updates a task's status and result, and syncs it in the history */
  private finalizeTask(
    task: Aria1Task,
    status: Aria1Status,
    result?: string,
    error?: string
  ): void {
    const finalized: Aria1Task = {
      ...task,
      status,
      result,
      error,
      finishedAt: new Date(),
    };

    this.taskHistory.update(history =>
      history.map(t => t.id === task.id ? finalized : t)
    );

    if (status === 'done') {
      this.currentTask.set(finalized);
    }
  }

  /** Clears the task history for the current session */
  clearHistory(): void {
    this.taskHistory.set([]);
    this.currentTask.set(null);
    console.info('[ARIA1] Session history cleared.');
  }
}
