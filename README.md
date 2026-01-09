# Seiton Platform

Plataforma web desenvolvida com React, TypeScript, Vite e Firebase.

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **pnpm** (versão 10.4.1 ou superior) - já está instalado no projeto

## 🚀 Como executar o projeto

### 1. Instalar dependências

Se ainda não instalou as dependências, execute:

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente (Opcional)

O projeto usa Firebase para autenticação e banco de dados. Para funcionalidades completas, você precisa configurar as variáveis de ambiente.

Crie um arquivo `.env` na raiz do projeto (`seiton-platform/.env`) com as seguintes variáveis:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

**Nota:** Você pode obter essas chaves no [Console do Firebase](https://console.firebase.google.com/):
1. Acesse seu projeto no Firebase Console
2. Vá em **Configurações do Projeto** > **Geral**
3. Role até a seção **Seus aplicativos** e copie as configurações

**Importante:** Se você não configurar o Firebase, o projeto ainda rodará, mas funcionalidades de autenticação e banco de dados não funcionarão.

### 3. Executar em modo de desenvolvimento

```bash
pnpm dev
```

O servidor de desenvolvimento será iniciado e estará disponível em:
- **http://localhost:3000** (ou na próxima porta disponível)

O Vite irá:
- Compilar o código automaticamente
- Recarregar a página quando você fizer alterações
- Exibir erros no console do navegador

### 4. Outros comandos disponíveis

```bash
# Verificar tipos TypeScript (sem compilar)
pnpm check

# Formatar código com Prettier
pnpm format

# Build para produção
pnpm build

# Executar servidor de produção (após build)
pnpm start

# Preview da build de produção
pnpm preview
```

## 📁 Estrutura do projeto

```
seiton-platform/
├── client/          # Aplicação React/TypeScript
│   ├── src/         # Código fonte do cliente
│   └── public/      # Arquivos estáticos
├── server/          # Servidor Express
├── shared/          # Código compartilhado
├── dist/            # Build de produção (gerado)
└── package.json     # Configurações e dependências
```

## 🛠️ Tecnologias utilizadas

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Firebase** - Autenticação e banco de dados
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Express** - Servidor backend
- **Wouter** - Roteamento

## ⚠️ Troubleshooting

### Erro ao instalar dependências
- Certifique-se de que o pnpm está instalado: `pnpm --version`
- Se necessário, instale o pnpm: `npm install -g pnpm`

### Porta 3000 já está em uso
- O Vite tentará usar a próxima porta disponível automaticamente
- Ou você pode alterar a porta no arquivo `vite.config.ts`

### Erros relacionados ao Firebase
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Certifique-se de que o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento após alterar o `.env`

## 📝 Notas

- O projeto usa **pnpm** como gerenciador de pacotes (não npm ou yarn)
- O servidor de desenvolvimento roda na porta 3000 por padrão
- Para produção, execute `pnpm build` e depois `pnpm start`



