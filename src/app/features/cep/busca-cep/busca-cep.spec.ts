import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { BuscaCep } from './busca-cep';

describe('BuscaCep', () => {
  let fixture: ComponentFixture<BuscaCep>;
  let loader: HarnessLoader;
  let emitidos: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BuscaCep] }).compileComponents();

    fixture = TestBed.createComponent(BuscaCep);
    loader = TestbedHarnessEnvironment.loader(fixture);
    emitidos = [];
    fixture.componentInstance.buscar.subscribe((cep) => emitidos.push(cep));
    await fixture.whenStable();
  });

  const campo = () => loader.getHarness(MatInputHarness);
  const campoDoFormulario = () => loader.getHarness(MatFormFieldHarness);
  const botao = () => loader.getHarness(MatButtonHarness.with({ selector: '.busca-cep__botao' }));

  it('deve emitir o CEP formatado ao buscar um CEP válido', async () => {
    await (await campo()).setValue('01001000');
    await (await botao()).click();

    expect(emitidos).toEqual(['01001-000']);
  });

  it('não deve emitir e deve marcar o campo como inválido com CEP incompleto', async () => {
    await (await campo()).setValue('0100');
    await (await botao()).click();

    const formField = await campoDoFormulario();
    expect(emitidos).toEqual([]);
    expect(await formField.isControlValid()).toBe(false);
    expect(await formField.getTextErrors()).toEqual([
      'Digite um CEP completo, no formato 00000-000.',
    ]);
  });

  it('deve pedir o CEP quando o campo estiver vazio', async () => {
    await (await botao()).click();

    expect(emitidos).toEqual([]);
    expect(await (await campoDoFormulario()).getTextErrors()).toEqual(['Informe o CEP.']);
  });

  it('deve levar o foco ao campo quando o CEP for inválido', async () => {
    await (await botao()).click();

    expect(await (await campo()).isFocused()).toBe(true);
  });

  describe('mensagem do resultado', () => {
    const alerta = () => fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    // Simula o fluxo real: o usuário busca e o container devolve uma mensagem de erro
    async function buscarComErro(cep: string, mensagem: string): Promise<void> {
      await (await campo()).setValue(cep);
      await (await botao()).click();
      fixture.componentRef.setInput('erro', mensagem);
      await fixture.whenStable();
    }

    it('deve exibir a mensagem recebida numa região de alerta', async () => {
      await buscarComErro('00000000', 'CEP não encontrado.');

      expect(alerta().textContent).toContain('CEP não encontrado.');
    });

    it('deve esconder a mensagem quando o usuário alterar o CEP', async () => {
      await buscarComErro('00000000', 'CEP não encontrado.');

      await (await campo()).setValue('0100');
      await fixture.whenStable();

      expect(alerta().textContent?.trim()).toBe('');
    });
  });

  it('deve desabilitar o botão e indicar "Buscando…" durante a busca', async () => {
    fixture.componentRef.setInput('buscando', true);

    const botaoBuscar = await botao();
    expect(await botaoBuscar.isDisabled()).toBe(true);
    expect(await botaoBuscar.getText()).toBe('Buscando…');
  });

  it('deve exibir o loader no botão só durante a busca, escondido dos leitores de tela', async () => {
    const loader = () => fixture.nativeElement.querySelector('.busca-cep__carregando');
    expect(loader()).toBeNull();

    fixture.componentRef.setInput('buscando', true);
    await fixture.whenStable();

    expect(loader()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('não deve emitir enquanto uma busca estiver em andamento', async () => {
    await (await campo()).setValue('01001000');
    fixture.componentRef.setInput('buscando', true);

    await (await botao()).click();

    expect(emitidos).toEqual([]);
  });
});
