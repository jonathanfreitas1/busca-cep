# Busca CEP

SPA para buscar endereços pelo CEP, usando a API pública do [ViaCEP](https://viacep.com.br/), e manter um histórico das buscas realizadas.

Desenvolvido por **Jonathan da Silva Freitas**.

## Funcionalidades

- **Home** com boas-vindas, nome e data, e um botão que leva à busca.
- **Header** com o logo e o menu (Home e Endereços › Buscar Endereços), fixo no topo, no bordô `#670000`.
- **Busca por CEP** com Reactive Forms: máscara `00000-000` enquanto digita, validação por regex e borda vermelha com mensagem quando o CEP é inválido. A requisição ao ViaCEP só sai com o CEP válido.
- **Tratamento de erros**: CEP inexistente, ViaCEP fora do ar (com timeout de 10 s) e falha ao salvar ou carregar o histórico, cada um com sua mensagem.
- **Histórico de buscas** numa tabela com CEP, Endereço, Data e um botão para remover (com confirmação). A tabela atualiza sem recarregar a página e o histórico persiste após o F5. Com mais de 10 buscas, a tabela ganha **paginação** (5, 10 ou 20 por página), e uma busca nova leva à página em que ela aparece.
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
git clone https://github.com/jonathanfreitas1/busca-cep.git
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
npm test         # 140 testes unitários (Vitest), em 15 arquivos
npm run build    # build de produção em dist/busca-cep/browser
```

O build mostra o **lazy load** funcionando: a Home (`home-routes`) e a feature de CEP (`cep-routes`) saem em arquivos separados do pacote inicial, baixados só quando o usuário navega até elas.

```
Initial chunk files | Names         |  Raw size | Estimated transfer size
chunk-ISNNHAHI.js   | -             | 310.32 kB |                80.63 kB
chunk-2TSXNQPC.js   | -             |  77.93 kB |                19.51 kB
chunk-WPW4ZXPT.js   | -             |  70.28 kB |                16.67 kB
styles-ZPZ6UBOQ.css | styles        |  63.42 kB |                 4.62 kB
main-DJ5EY3KB.js    | main          |  35.84 kB |                 9.54 kB
                    | Initial total | 557.79 kB |               130.96 kB

Lazy chunk files    | Names         |  Raw size | Estimated transfer size
chunk-WA6UWSTC.js   | cep-routes    | 238.93 kB |                45.87 kB
chunk-7PWKKG6U.js   | home-routes   |   1.42 kB |               685 bytes
```

## Deploy

O build gera um site **estático** em `dist/busca-cep/browser`, que pode ser publicado em qualquer hospedagem de arquivos (Nginx, Apache, Netlify, Vercel, GitHub Pages etc.). Três cuidados:

1. **Rotas da SPA**: o servidor deve devolver o `index.html` para qualquer caminho, senão recarregar a página em `/enderecos` dá erro 404. Exemplos:
   - Nginx: `try_files $uri $uri/ /index.html;`
   - Netlify: arquivo `_redirects` em `public/` com a linha `/* /index.html 200`
2. **Subpasta**: se o site não ficar na raiz do domínio (ex.: GitHub Pages em `usuario.github.io/busca-cep/`), gere o build com o caminho base: `npm run build -- --base-href /busca-cep/`.
3. **API do histórico**: em produção o app usa a URL de `src/environments/environment.ts` (hoje `http://localhost:3000`). Para publicar, hospede o json-server (ou outra API REST com o recurso `/buscas`) e troque essa URL antes do build. A busca no ViaCEP funciona sem configuração.

Para conferir o build de produção localmente, com a API rodando (`npm run api`):

```bash
npm run build
npx serve -s dist/busca-cep/browser -l 4300   # http://localhost:4300
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
