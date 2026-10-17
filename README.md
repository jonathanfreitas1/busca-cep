# Busca CEP

SPA para buscar endereços pelo CEP, usando a API pública do [ViaCEP](https://viacep.com.br/), e manter um histórico das buscas realizadas.

Desenvolvido por **Jonathan da Silva Freitas**.

## Notas para a avaliação

Esta é a entrega do teste de front-end da SCCON. Todos os requisitos do PDF foram implementados; os pontos abaixo explicam onde a implementação difere do que o PDF pede, e por quê.

### Angular 22 em vez de Angular 5/6

O Angular 5/6 está sem suporte desde 2019/2020, exige Node 10 e traz dependências com vulnerabilidades conhecidas. Usei a versão atual mantendo todos os requisitos funcionais e de arquitetura.

### Componentes standalone em vez de `NgModule`

Cada módulo do diagrama (Principal, Home e CEP) é uma **feature com lazy load** (`loadChildren` + arquivo de rotas), o padrão recomendado desde o Angular 17. O carregamento sob demanda continua real: Home e Endereços saem em arquivos separados no build e só são baixados quando o usuário navega até eles (veja "Testes e build"). A tabela "Arquitetura → código" liga cada caixa do diagrama a uma pasta.

### `input()` / `output()` em vez de `@Output()` + `EventEmitter`

São os sucessores oficiais dos decorators, com a mesma comunicação entre componente pai e filho.

### Grid do Bootstrap 5 em vez do Bootstrap 4

O Angular Material cobre os componentes de formulário e navegação; como ele não tem grid de layout, uso **só o grid** do Bootstrap 5 (sem o CSS global nem o JavaScript), versão compatível com o Angular atual.

### Diferenciais implementados

- Logo extraído **vetorialmente** do próprio PDF (veja "Principais desafios").
- Histórico persistido via **REST** com json-server.
- Angular Material nos formulários e na navegação; variáveis e pseudoelementos no Sass.
- Animação no loader da busca, transições de `:hover`/`:active` e destaque animado na linha nova.

## Funcionalidades

- **Home** com boas-vindas, nome e data, e um botão que leva à busca.
- **Header** com o logo e o menu (Home e Endereços › Buscar Endereços), fixo no topo, no bordô `#670000`.
- **Busca por CEP** com Reactive Forms: máscara `00000-000` enquanto digita, validação por regex e borda vermelha com mensagem quando o CEP é inválido. A requisição ao ViaCEP só sai com o CEP válido.
- **Tratamento de erros**: CEP inexistente, ViaCEP fora do ar (com timeout de 10 s) e falha ao salvar ou carregar o histórico, cada um com sua mensagem.
- **Histórico de buscas** numa tabela com CEP, Endereço, Data e um botão para remover (com confirmação). A tabela atualiza sem recarregar a página e o histórico persiste após o F5.
- **Responsivo**: no celular, cada linha da tabela vira um cartão.
- **Animações**: loader durante a busca, destaque na linha recém-adicionada e transições de hover. Tudo desligado para quem ativa "reduzir movimento" no sistema.

## Tecnologias

|                  |                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Framework        | Angular 22 (componentes standalone, signals, controle de fluxo nativo)                     |
| Componentes      | Angular Material 22, com paleta gerada a partir de `#670000`                               |
| Layout           | Grid do Bootstrap 5 (só o `bootstrap-grid`, sem o CSS global nem o JS)                     |
| Estilos          | Sass (SCSS) com variáveis e mixins próprios                                                |
| HTTP e estado    | RxJS (Observables) nos serviços REST; signals para o estado da tela                        |
| API do histórico | [json-server](https://github.com/typicode/json-server) (REST simulado, dados em `db.json`) |
| Testes           | Vitest + jsdom, com os harnesses do Angular Material                                       |

## Pré-requisitos

- **Node.js 24** (a versão está no `.nvmrc`; com o nvm, basta `nvm use`)
- **npm 11**
- Acesso à internet (o ViaCEP é uma API externa)

## Como executar

```bash
git clone <url-do-repositório>
cd busca-cep
npm install
```

A aplicação precisa de **dois terminais**, um para a API do histórico e outro para o Angular:

```bash
# Terminal 1 — API do histórico em http://localhost:3000/buscas
npm run api
```

```bash
# Terminal 2 — aplicação em http://localhost:4200
npm start
```

O `db.json` já vem com três buscas de exemplo. Como o json-server grava nele, as buscas feitas durante o uso ficam salvas ali.

## Testes e build

```bash
npm test         # 131 testes unitários (Vitest), em 15 arquivos
npm run build    # build de produção em dist/busca-cep/browser
```

O build mostra o **lazy load** funcionando: a Home (`home-routes`) e a feature de CEP (`cep-routes`) saem em arquivos separados do pacote inicial, baixados só quando o usuário navega até elas.

```
Initial chunk files | Names         |  Raw size | Estimated transfer size
chunk-GNCVYSVI.js   | -             | 297.41 kB |                78.69 kB
chunk-WWDJUV6F.js   | -             |  77.93 kB |                19.53 kB
styles-LPLZLJ65.css | styles        |  62.83 kB |                 4.56 kB
chunk-YK3XCA2B.js   | -             |  61.41 kB |                14.92 kB
main-5AH7KO4A.js    | main          |  35.86 kB |                 9.56 kB
                    | Initial total | 535.45 kB |               127.27 kB

Lazy chunk files    | Names         |  Raw size | Estimated transfer size
chunk-VCRYDPT5.js   | cep-routes    | 164.46 kB |                32.20 kB
chunk-K7ZGOTXP.js   | home-routes   |   1.43 kB |               659 bytes
```

## Estrutura do projeto

```
src/
├── app/
│   ├── app.ts, app.config.ts, app.routes.ts   # Módulo principal: shell, providers e rotas
│   ├── core/layout/header/                    # Header (logo + menu)
│   ├── features/
│   │   ├── home/                              # Feature Home (lazy)
│   │   └── cep/                               # Feature de CEP (lazy), em /enderecos
│   │       ├── cep-page/                      # Página (container): liga o store aos componentes
│   │       ├── busca-cep/                     # Formulário de busca
│   │       ├── lista-buscas/                  # Listagem das buscas
│   │       ├── models/                        # Endereco, Busca, erros e resposta do ViaCEP
│   │       └── services/                      # ViaCepService, BuscasStore e repositórios
│   └── shared/                                # Reutilizáveis: tabela genérica, diálogo de
│                                              # confirmação, máscara e validador de CEP
└── styles/                                    # Variáveis, mixins, botões e paleta do tema
```

### Arquitetura → código

| Parte da arquitetura             | Implementação                                        |
| -------------------------------- | ---------------------------------------------------- |
| Módulo Principal                 | `src/app/app.ts` + `app.config.ts` + `app.routes.ts` |
| Componente Header                | `src/app/core/layout/header/`                        |
| Módulo Home (lazy)               | `src/app/features/home/` (`home.routes.ts`)          |
| Componente de Home               | `src/app/features/home/home/`                        |
| Módulo de CEP (lazy)             | `src/app/features/cep/` (`cep.routes.ts`)            |
| Componente de Busca de CEP       | `src/app/features/cep/busca-cep/`                    |
| Componente de Listagem de buscas | `src/app/features/cep/lista-buscas/`                 |

## Decisões técnicas

### Angular atual, com componentes standalone

Em vez de `NgModule`, cada módulo da arquitetura (Principal, Home e CEP) é uma **feature com lazy load** (`loadChildren` + arquivo de rotas). É o padrão recomendado desde o Angular 17, e o lazy load é real: cada feature é um arquivo separado no build (veja a seção "Testes e build").

### `input()` / `output()` para a comunicação entre componentes

São os sucessores oficiais de `@Input()` e `@Output()` + `EventEmitter`, com a mesma comunicação entre componente pai e filho.

### Angular Material + só o grid do Bootstrap 5

O Material cobre os componentes de formulário e navegação; como ele não tem grid de layout, uso o grid do Bootstrap para o layout responsivo, sem trazer o CSS global nem o JavaScript do Bootstrap.

### Outras decisões

- **Container e apresentacionais**: só a `CepPage` fala com o estado; `BuscaCep` e `ListaBuscas` recebem dados por `input()` e emitem eventos por `output()`.
- **Estado em signals** (`BuscasStore`) e **HTTP com Observables**: signals para o que a tela exibe; RxJS (`switchMap`, `timeout`, `catchError`, `finalize`) nos serviços REST.
- **Repositório abstrato** (`BuscasRepository`) com implementação via json-server (`BuscasApiRepository`): o store não sabe onde o histórico é guardado, e trocar a implementação é uma linha em `cep.routes.ts`.
- **Máscara e validador próprios** (`appCepMask` e `cepValidator`, com a regex `/^\d{5}-\d{3}$/`), sem bibliotecas extras.
- **Busca só salva se o ViaCEP encontrou o endereço**; CEP repetido gera uma nova linha, porque é um histórico.
- **Serviços e models dentro da feature de CEP**, para irem inteiros no arquivo carregado sob demanda.
- **Tabela genérica** (`Tabela<T>`) em `shared/`: a `ListaBuscas` só define as colunas. Usa `<table>` nativa e, no celular, vira cartões.

## Acessibilidade

- HTML semântico: `header`, `nav`, `main`, `section` com títulos, `footer`, `form` com `role="search"`, `table` com `caption` e `th`.
- Link "Pular para o conteúdo", navegação completa pelo teclado e gestão de foco (erro → campo; remoção → linha vizinha; diálogo → "Cancelar").
- Mensagens de erro em regiões `role="alert"`, com ícone e texto (não só cor).
- Contraste AA em todas as combinações (o menor é 6,16:1) e cores de alto contraste para `prefers-contrast: more`.
- Auditado com axe-core (WCAG 2.2 AA) sem violações e **100 no Lighthouse** (Acessibilidade).

## Principais desafios

- **Lazy load sem `NgModule`**: manter a separação em módulos (Principal, Home e CEP) com componentes standalone, comprovando no build que cada feature vira um arquivo à parte.
- **Tabela responsiva e acessível**: no celular a tabela muda de `display` para virar cartões, e alguns navegadores deixam de anunciá-la como tabela. Os papéis ARIA explícitos resolvem, mas exigiram cuidado com o foco (o alvo do foco passou do `caption` para a própria tabela).
- **Foco depois de remover**: quando a linha some, o botão que tinha o foco deixa de existir; o foco vai para a linha vizinha ou para a tabela vazia.
- **Paleta da marca no Material 3**: a paleta gerada a partir de `#670000` usaria um vermelho mais claro como cor principal; o bordô exato foi fixado com `mat.theme-overrides`.
- **Logo vetorial a partir de um PDF**: o logo só existia dentro de um PDF. Um script em Python leu os comandos de desenho da página (`m`, `l`, `c`, `f`, com as transformações `cm` e as cores em CMYK) e os traduziu para `<path>` de SVG: o resultado (`public/images/logo-sccon.svg`, ~18 KB) é o desenho original, sem imagem embutida e nítido em qualquer tamanho.
