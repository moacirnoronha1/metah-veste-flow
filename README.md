# Metah Vestimenta Manager

Crie um ERP básico, moderno e fácil de usar para a Metah Veste, destinado ao controle de vendas, estoque e clientes.

O sistema será acessado por um link restrito, utilizado somente pelo proprietário. Portanto, não deve ter login, cadastro de usuários ou níveis de permissão.

O sistema deve ser responsivo, funcionar bem no celular e no computador e ter uma identidade visual jovem, minimalista e alinhada à Metah Veste.

1. Dashboard

- Total vendido no dia e no mês

- Quantidade de vendas

- Produtos com estoque baixo

- Produtos mais vendidos

- Quantidade de clientes cadastrados

2. Produtos e estoque

- Cadastro com nome, categoria, tamanho, cor, custo, preço de venda e quantidade

- Controle de estoque separado por tamanho e cor

- Entrada, saída e ajuste manual

- Alerta de estoque baixo

- Histórico das movimentações

3. Vendas

- Tela simples e rápida para registrar vendas

- Seleção de produto, tamanho, cor e quantidade

- Cliente opcional

- Desconto e forma de pagamento

- Pagamentos por Pix, dinheiro, débito, crédito ou link

- Opção de parcelamento

- Baixa automática no estoque ao finalizar

- Status: pendente, paga, cancelada ou trocada

- Histórico com filtros por data, cliente e pagamento

4. Clientes

- Nome, telefone, Instagram, e-mail, CPF e aniversário

- Histórico de compras

- Valor total gasto

- Campo para observações

5. Trocas

- Registrar o produto devolvido e o novo produto entregue

- Retornar automaticamente o produto devolvido ao estoque

- Dar baixa no novo produto

- Registrar diferença de valor, quando existir

6. Relatórios

- Vendas por período

- Faturamento

- Lucro estimado

- Produtos mais vendidos

- Estoque atual e estoque baixo

- Vendas por forma de pagamento

Todos os botões devem funcionar, incluindo cadastrar, editar, excluir, salvar, cancelar e pesquisar. Utilize um banco de dados para manter as informações salvas.

Priorize uma navegação simples, visual limpo, poucos campos por etapa e rapidez no registro das vendas. Não inclua contabilidade, emissão fiscal, contas a pagar ou outras funções complexas neste primeiro momento.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://metah-veste-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c561e4e2-9c7d-4dc0-b5ed-650d941e0e8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
