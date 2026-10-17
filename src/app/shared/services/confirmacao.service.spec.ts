import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { ID_MENSAGEM_CONFIRMACAO } from '../components/dialogo-confirmacao/dialogo-confirmacao';
import { ConfirmacaoService } from './confirmacao.service';

// O diálogo abre "por cima" da página: o teste precisa de uma página qualquer
@Component({ template: '' })
class Pagina {}

describe('ConfirmacaoService', () => {
  let fixture: ComponentFixture<Pagina>;
  let loader: HarnessLoader;
  let servico: ConfirmacaoService;
  let respostas: boolean[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagina],
      // No ambiente de teste (jsdom) as animações CSS nunca terminam, e o diálogo
      // esperaria por elas para fechar e para posicionar o foco
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagina);
    // documentRootLoader: o diálogo é renderizado fora do componente, no fim do <body>
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    servico = TestBed.inject(ConfirmacaoService);
    respostas = [];
  });

  function abrir(textoConfirmar?: string, destrutiva?: boolean): void {
    servico
      .confirmar({
        titulo: 'Remover busca',
        mensagem: 'Remover a busca do CEP 01001-000 do histórico?',
        textoConfirmar,
        destrutiva,
      })
      .subscribe((resposta) => respostas.push(resposta));
  }

  const dialogo = () => loader.getHarness(MatDialogHarness);
  const botao = async (texto: string) =>
    (await dialogo()).getHarness(MatButtonHarness.with({ text: texto }));

  it('deve exibir o título e a mensagem', async () => {
    abrir('Remover');

    expect(await (await dialogo()).getTitleText()).toBe('Remover busca');
    expect(await (await dialogo()).getContentText()).toBe(
      'Remover a busca do CEP 01001-000 do histórico?',
    );
  });

  it('deve emitir true quando o usuário confirmar', async () => {
    abrir('Remover');

    await (await botao('Remover')).click();
    await fixture.whenStable();

    expect(respostas).toEqual([true]);
  });

  it('deve emitir false quando o usuário cancelar', async () => {
    abrir('Remover');

    await (await botao('Cancelar')).click();
    await fixture.whenStable();

    expect(respostas).toEqual([false]);
  });

  it('deve emitir false quando o usuário apertar Esc', async () => {
    abrir('Remover');

    await (await dialogo()).close(); // o harness fecha com a tecla Esc
    await fixture.whenStable();

    expect(respostas).toEqual([false]);
  });

  it('deve usar "Confirmar" quando o texto do botão não for informado', async () => {
    abrir();

    expect(await botao('Confirmar')).toBeTruthy();
  });

  it('deve se anunciar como alerta e ser descrito pela mensagem', async () => {
    abrir('Remover');

    const harness = await dialogo();
    expect(await harness.getRole()).toBe('alertdialog');
    expect(await harness.getAriaDescribedby()).toBe(ID_MENSAGEM_CONFIRMACAO);
  });

  it('deve usar o mesmo formato (filled) nos dois botões', async () => {
    abrir('Remover');

    const botoes = await (await dialogo()).getAllHarnesses(MatButtonHarness);
    const aparencias = await Promise.all(botoes.map((b) => b.getAppearance()));
    expect(aparencias).toEqual(['filled', 'filled']);
  });

  it('deve destacar o botão de confirmar em vermelho só na ação destrutiva', async () => {
    abrir('Remover', true);
    const perigo = await (await (await botao('Remover')).host()).hasClass('botao--perigo');
    expect(perigo).toBe(true);
    await (await botao('Cancelar')).click();
    await fixture.whenStable();

    abrir('Salvar');
    const neutro = await (await (await botao('Salvar')).host()).hasClass('botao--perigo');
    expect(neutro).toBe(false);
  });

  // O foco inicial vai para o primeiro elemento focável ("first-tabbable").
  // O foco em si não dá para verificar aqui: o jsdom não calcula layout, e o Material
  // considera não focável um elemento sem tamanho. Verificado no navegador.
  it('deve ter o "Cancelar" como primeiro botão (recebe o foco inicial)', async () => {
    abrir('Remover');

    const botoes = await (await dialogo()).getAllHarnesses(MatButtonHarness);
    expect(await botoes[0].getText()).toBe('Cancelar');
  });
});
