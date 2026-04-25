import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-source-marquee',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .animate-scroll {
      animation: scroll 40s linear infinite;
    }
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .mask-image-edges {
      mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
    }
  `],
  template: `
    <div class="w-full overflow-hidden py-8 mt-8 relative mask-image-edges">
      <div class="flex whitespace-nowrap animate-scroll w-max items-center pointer-events-none">
        <!-- Group 1 -->
        <div class="flex items-center gap-20 px-10 text-black dark:text-white">
          <div class="flex items-center gap-2">
            <div class="w-10 h-8 bg-black dark:bg-white rounded-[0.5rem] flex items-center justify-center">
              <div class="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white dark:border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
            </div>
            <span class="font-bold tracking-tighter text-3xl">YouTube</span>
          </div>
          <span class="font-black tracking-tighter text-4xl">Cakenews</span>
          <span class="font-black tracking-tighter text-4xl">CNN</span>
          <span class="font-bold tracking-tighter text-3xl">Bloomberg</span>
          <div class="flex gap-0.5">
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">C</span>
          </div>
          <span class="font-black tracking-widest text-3xl uppercase">Reuters</span>
          <div class="flex items-center">
            <span class="font-black text-4xl tracking-tight">FRANCE</span>
            <span class="font-light text-4xl tracking-tight ml-1">24</span>
          </div>
          <span class="font-bold tracking-widest text-2xl">AL JAZEERA</span>
          <span class="font-black tracking-tight text-3xl">Saglows</span>
          <span class="font-black tracking-tight text-3xl">The New York Times</span>
          <span class="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 font-bold text-xl tracking-tight">jeune afrique</span>
          <span class="font-black tracking-tighter text-3xl uppercase">The Times of India</span>
          <span class="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 font-black tracking-tighter text-3xl">RFI</span>
          <div class="flex items-center">
            <span class="font-black text-4xl tracking-tight">GABON</span>
            <span class="font-light text-4xl tracking-tight ml-1">24</span>
          </div>
        </div>
        <!-- Group 2 (Duplicate for infinite scroll) -->
        <div class="flex items-center gap-20 px-10 text-black dark:text-white">
          <div class="flex items-center gap-2">
            <div class="w-10 h-8 bg-black dark:bg-white rounded-[0.5rem] flex items-center justify-center">
              <div class="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white dark:border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
            </div>
            <span class="font-bold tracking-tighter text-3xl">YouTube</span>
          </div>
          <span class="font-black tracking-tighter text-4xl">Cakenews</span>
          <span class="font-black tracking-tighter text-4xl">CNN</span>
          <span class="font-bold tracking-tighter text-3xl">Bloomberg</span>
          <div class="flex gap-0.5">
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">B</span>
            <span class="bg-black dark:bg-white text-white dark:text-black w-10 h-10 flex items-center justify-center font-bold text-2xl">C</span>
          </div>
          <span class="font-black tracking-widest text-3xl uppercase">Reuters</span>
          <div class="flex items-center">
            <span class="font-black text-4xl tracking-tight">FRANCE</span>
            <span class="font-light text-4xl tracking-tight ml-1">24</span>
          </div>
          <span class="font-bold tracking-widest text-2xl">AL JAZEERA</span>
          <span class="font-black tracking-tight text-3xl">Saglows</span>
          <span class="font-black tracking-tight text-3xl">The New York Times</span>
          <span class="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 font-bold text-xl tracking-tight">jeune afrique</span>
          <span class="font-black tracking-tighter text-3xl uppercase">The Times of India</span>
          <span class="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 font-black tracking-tighter text-3xl">RFI</span>
          <div class="flex items-center">
            <span class="font-black text-4xl tracking-tight">GABON</span>
            <span class="font-light text-4xl tracking-tight ml-1">24</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SourceMarqueeComponent {}
