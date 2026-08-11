# Consórcio ou Financiamento: qual custa menos?

Simulador web **imparcial** para comparar o desembolso de um consórcio e de um financiamento a partir das mesmas premissas. Tudo roda no navegador — não há backend nem envio de dados.

## Premissas financeiras (o que o modelo faz e o que não faz)

### Consórcio

- Modelo **linear e transparente**, não a tabela oficial de uma administradora.
- Encargos = crédito × (taxa de administração + fundo de reserva), diluídos no prazo.
- **Não há juros de financiamento** no sentido SAC/Price. O custo aparece como taxa, fundo, seguro, adesão e reajuste.
- O **lance entra uma vez** no fluxo, no mês de contemplação informado, e abate o saldo. Não é somado de novo nas parcelas.
- Duas regras de lance: **reduzir parcelas** (prazo original) ou **reduzir prazo** (parcela teórica até zerar).
- Lance **próprio** vs **embutido**: no embutido o crédito disponível cai; para comprar o mesmo bem o complemento ainda aparece como desembolso.
- Reajuste anual (padrão 0%) multiplica o saldo remanescente a cada 12 meses. Contratos reais usam índices e regras de grupo que esta versão não replica.
- O mês de contemplação é **premissa do usuário**, não previsão de sorteio.

### Financiamento

- **SAC**: amortização constante; juros = saldo × taxa efetiva mensal; parcela decrescente.
- **Price**: PMT = P × [i(1+i)ⁿ] / [(1+i)ⁿ − 1]; última parcela acerta o saldo.
- Taxa mensal informada = **efetiva**. Anual efetiva = (1 + i)¹² − 1. Anual nominal = 12 × i. O cálculo usa sempre a efetiva mensal.
- Entrada é desembolso inicial, não “custo extra” do bem. Total = entrada + parcelas + juros + seguros + tarifas.
- Se o **CET** for usado e marcado como já inclusivo, seguros e tarifas da tela **não são somados de novo**.
- Valor residual (balloon) é opcional.

### Comparação

- Total **nominal** e **valor presente** (taxa de desconto anual efetiva configurável, padrão 10% a.a.).
- A ferramenta **não declara** que uma modalidade é melhor em qualquer caso. Ela diz o que acontece **neste cenário**.
- “Quando espera utilizar o crédito?” é qualitativo. O fluxo do consórcio usa o mês de contemplação.

## Como executar localmente

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (em geral `http://localhost:5173`).

```bash
npm test          # fórmulas SAC, Price, taxas, consórcio e VP
npm run build     # gera a pasta dist/
npm run preview   # serve o build
```

## Como publicar de graça

O projeto é estático (`base: './'` no Vite), então qualquer host de arquivos serve.

### Vercel

1. Envie o repositório ao GitHub.
2. Em [vercel.com](https://vercel.com), importe o projeto.
3. Framework: Vite. Build: `npm run build`. Output: `dist`.

### Netlify

1. Importe o repositório em [netlify.com](https://www.netlify.com).
2. Build: `npm run build`. Publish directory: `dist`.

### Cloudflare Pages

1. Novo projeto a partir do Git.
2. Build command: `npm run build`. Output: `dist`.

### GitHub Pages

```bash
npm run build
```

Publique o conteúdo de `dist/` (Actions com `peaceiris/actions-gh-pages`, ou arraste a pasta em Pages se o fluxo permitir). Como o `base` é relativo, também funciona em subpasta.

## Estrutura

```
src/calc/           Fórmulas, formatação, testes
src/components/     Interface
src/App.tsx         Orquestração do simulador
```

## Campos extras nesta versão

Além do pedido original:

- mês estimado de contemplação
- lance próprio vs embutido
- taxa de adesão e outros custos mensais do consórcio
- IOF / taxas iniciais, valor residual
- CET com opção de não duplicar custos
- taxa de desconto para valor presente
- cenários “e se” e cenário salvo
- exportação do cronograma em CSV
