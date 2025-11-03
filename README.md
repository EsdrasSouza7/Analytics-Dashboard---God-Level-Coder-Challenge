# 🚀 Analytics Dashboard - Restaurantes Challenge Brand

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

Um dashboard analítico completo para redes de restaurantes, oferecendo insights em tempo real sobre vendas, desempenho operacional, análise de clientes e métricas de delivery.

## ✨ Funcionalidades Principais

### 📊 **Visualizações de Dados**
- **Gráfico de Receita** - Evolução temporal de vendas e pedidos
- **Top Produtos** - Ranking por receita e quantidade
- **Mapa de Calor** - Vendas por dia da semana e horário
- **Comparação de Lojas** - Performance entre unidades
- **KPIs em Tempo Real** - Métricas-chave do negócio

### 👥 **Análise de Clientes**
- Segmentação por comportamento de compra
- Ticket médio e frequência
- Clientes ativos vs inativos
- Análise de retenção e lifetime value

### 🚚 **Performance de Delivery**
- Tempos de entrega e produção
- Análise por região e plataforma
- Taxas de sucesso e cancelamento
- Métricas de eficiência operacional

### 🎨 **Experiência Personalizável**
- Layout arrastável (1 ou 2 colunas)
- Componentes minimizáveis
- Filtros avançados multi-critério
- Exportação de relatórios em PDF/Excel

## 🛠️ Stack Tecnológica

### **Frontend**
- ⚛️ React 18 + Vite
- 🎨 Tailwind CSS
- 📊 Chart.js / Recharts
- 🎯 Lucide React (ícones)
- ♿ Acessibilidade completa

### **Backend**
- 🟢 Node.js + Express
- 🐘 PostgreSQL
- 🐳 Docker & Docker Compose
- 🔄 API REST otimizada

## 📋 Pré-requisitos

- **Node.js** 18 ou superior
- **Docker** e **Docker Compose**
- **PostgreSQL** 15 (opcional, incluído no Docker)

## 🚀 Instalação e Execução

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/analytics-dashboard.git
cd analytics-dashboard
```

### 2. Configuração do Backend

#### 🐳 **Opção com Docker (Recomendada)**
```bash
cd backend

# Edite o arquivo .env com suas configurações

# Execute o Docker Compose
docker-compose up -d
```

#### 💻 **Opção de Desenvolvimento Local**
```bash
cd backend

# Instale as dependências
npm install

# Configure o ambiente
# Edite o .env com suas configurações de banco

# Inicie o servidor de desenvolvimento
npm run dev
```

**Arquivo `.env` do Backend:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=challenge_db
DB_USER=challenge
DB_PASSWORD=challenge_2024
PORT=3001
GOOGLE_AI_API_KEY='sua api aqui'
```

### 3. Configuração do Frontend
```bash
cd frontend

# Instale as dependências
npm install

http://localhost:3001/api

# Inicie o servidor de desenvolvimento
npm run dev
```

### 4. Acesso à Aplicação
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:3001
- 📊 **PgAdmin** (opcional): http://localhost:5050

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza um schema otimizado para analytics com as principais tabelas:

```sql
-- Tabelas principais
sales               -- Vendas e pedidos
customers           -- Dados de clientes
stores              -- Informações das lojas
products            -- Catálogo de produtos
delivery_sales      -- Métricas de delivery
channels            -- Canais de venda
```

## 📡 API Endpoints

### 📈 **Métricas e Analytics**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/kpis` | Métricas principais do negócio |
| `GET` | `/api/revenue-chart` | Gráfico de receita temporal |
| `GET` | `/api/top-products` | Ranking de produtos |
| `GET` | `/api/hour-heatmap` | Mapa de calor horário |

### 👥 **Análise de Clientes**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/customer-analytics` | Segmentação e comportamento |
| `GET` | `/api/customer-lifetime` | Valor do cliente no tempo |

### 🚚 **Performance de Delivery**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/delivery-overview` | Visão geral do delivery |
| `GET` | `/api/delivery-regions` | Análise por região |
| `GET` | `/api/delivery-platforms` | Performance por plataforma |
| `GET` | `/api/delivery-timing` | Análise temporal |

### ⚙️ **Utilitários**
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/filter-options` | Opções para filtros |
| `POST` | `/api/export-report` | Exportação de relatórios |

## 🐛 Solução de Problemas Comuns

### 🔧 **Erro de Memória Compartilhada PostgreSQL**
```bash
# No Linux/Mac
sudo sysctl -w kernel.shmmax=268435456
sudo sysctl -w kernel.shmall=4194304

# Ou reinicie o container
docker-compose restart postgres
```

### 🗂️ **Container PostgreSQL Não Inicia**
```bash
# Limpe volumes antigos
docker-compose down -v
docker volume prune

# Reconstrua e inicie
docker-compose up -d --build
```

## 📁 Estrutura do Projeto

```
analytics-dashboard/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 routes/           # Endpoints da API
│   │   ├── 📁 models/           # Modelos de dados
│   │   ├── 📁 utils/            # Utilitários e query builder
│   │   ├── 📁 middleware/       # Middlewares customizados
│   │   └── server.js           # Servidor principal
│   ├── docker-compose.yml      # Configuração Docker
│   ├── Dockerfile
│   └── package.json
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/       # Componentes React
│   │   │   ├── KPICards.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   ├── AnomalyAlerts.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   └── ...
│   │   ├── 📁 hooks/            # Hooks customizados
│   │   ├── 📁 utils/            # Utilitários do frontend
│   │   ├── App.jsx             # Componente principal
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   └── package.json
└── 📄 README.md
```

## 👨‍💻 Autores

- **Esdras Souza dos Santos** - [EsdrasSouza7](https://github.com/EsdrasSouza7)

---
**Desenvolvido com ❤️ para otimizar operações de restaurantes**

*Última atualização: Novembro 2025*
```
