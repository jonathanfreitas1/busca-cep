import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './core/layout/header/header';

@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly conteudo = viewChild.required<ElementRef<HTMLElement>>('conteudo');

  // Move o foco para o <main> sem navegar: com <base href="/">, um href="#conteudo"
  // levaria para "/#conteudo" e recarregaria a página na Home.
  protected pularParaConteudo(evento: Event): void {
    evento.preventDefault();
    this.conteudo().nativeElement.focus();
  }
}
