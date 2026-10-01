# Trilha Azure: do Zero ao Intermediário

Organograma de estudo do Microsoft Azure em português, com 8 níveis e 32 etapas.
Cada etapa tem um vídeo gratuito no YouTube (PT-BR) e uma prática para fazer no portal.

**Quadro no Miro:** https://miro.com/app/board/uXjVHgYRJFk=/

## Como estudar

1. **Assista** ao vídeo da etapa.
2. **Pratique** no portal do Azure com a sua conta gratuita.
3. **Marque** o status no Painel de Progresso do quadro.
4. **Limpe**: exclua o grupo de recursos ao terminar, para não gerar custos.

```
COMECE AQUI
   |
NÍVEL 0: Fundamentos da Nuvem  (Semana 1)
   ├── 0.1 O que é computação em nuvem
   ├── 0.2 IaaS, PaaS e SaaS
   ├── 0.3 Nuvem pública, privada e híbrida
   └── 0.4 O que é o Microsoft Azure
   |
NÍVEL 1: Configuração Inicial  (Semana 1)
   ├── 1.1 Criar a conta gratuita
   ├── 1.2 Tour pelo Portal do Azure
   ├── 1.3 Assinaturas e grupos de recursos
   └── 1.4 Custos sob controle
   |
NÍVEL 2: Identidade e Governança  (Semana 2)
   ├── 2.1 Microsoft Entra ID (antigo Azure AD)
   ├── 2.2 RBAC: acesso por funções
   ├── 2.3 MFA e Acesso Condicional
   └── 2.4 Policy, Tags e Bloqueios
   |
NÍVEL 3: Infraestrutura Essencial  (Semana 3)
   ├── 3.1 Máquinas Virtuais
   ├── 3.2 Storage Account: Blob e Files
   ├── 3.3 Redes Virtuais: VNet e NSG
   └── 3.4 Alta disponibilidade
   |
NÍVEL 4: Aplicações e Dados  (Semana 4)
   ├── 4.1 App Service
   ├── 4.2 Azure SQL Database
   ├── 4.3 Azure Functions
   └── 4.4 Contêineres: ACI e AKS
   |
NÍVEL 5: Automação e DevOps  (Semana 5)
   ├── 5.1 Cloud Shell e Azure CLI
   ├── 5.2 Azure PowerShell
   ├── 5.3 Infraestrutura como Código
   └── 5.4 CI/CD com Azure DevOps
   |
NÍVEL 6: Operação e Segurança  (Semana 6)
   ├── 6.1 Azure Monitor e Log Analytics
   ├── 6.2 Azure Backup
   ├── 6.3 Azure Key Vault
   └── 6.4 Microsoft Defender for Cloud
   |
NÍVEL 7: Certificação e Próximos Passos  (Semanas 7 e 8)
   ├── 7.1 Revisão completa AZ-900
   ├── 7.2 Preparatório AZ-104
   ├── 7.3 Microsoft Learn e a prova
   └── 7.4 Projeto prático completo
   |
META ALCANÇADA: Azure intermediário, rumo à AZ-104
```

## Fase 1: Nível Zero (Níveis 0 e 1)

### Nível 0: Fundamentos da Nuvem
_Entender antes de clicar (Semana 1)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **0.1** O que é computação em nuvem | Recursos sob demanda, elasticidade e pagamento por uso. | Liste 3 serviços que você já usa e que rodam na nuvem. | [Aula 01 \| Modulo 1 - Computação em Nuvem](https://www.youtube.com/watch?v=bZ2NiIlCikc) (DaenyTech) | [O que é cloud computing e como funciona? (Computação em Nuvem)](https://www.youtube.com/watch?v=ymZo-ZwXFw8) (Eu TI Ensino) |
| **0.2** IaaS, PaaS e SaaS | Os 3 modelos de serviço e quem cuida de cada parte. | Classifique VM, App Service e Microsoft 365. | [Aula 05 - Módulo 1 \| Tipos de Serviços de Nuvem](https://www.youtube.com/watch?v=ryxgRmin8E4) (DaenyTech) | [Introdução à Computação em Nuvem - IaaS, PaaS, SaaS](https://www.youtube.com/watch?v=I_bP06BSbPY) (hcode) |
| **0.3** Nuvem pública, privada e híbrida | Modelos de implantação e a lógica CapEx x OpEx. | Descreva um cenário em que a nuvem híbrida faz sentido. | [AZ 900 - Conceitos de Cloud Computing](https://www.youtube.com/watch?v=a9dEC_nDrBo) (Casal Full Stack) | [Aula 02 - Módulo 01 \| Tipos de Nuvem: Pública, Privada e Híbrida - Curso AZ-900](https://www.youtube.com/watch?v=14V25zRmpsM) (DaenyTech) |
| **0.4** O que é o Microsoft Azure | Regiões, pares de regiões e zonas de disponibilidade. | Encontre a região Brazil South no mapa do Azure. | [Aula 02 \| Módulo 02 - Regiões e Zonas de Disponibilidade do Azure](https://www.youtube.com/watch?v=Q2025LP3AyU) (DaenyTech) | [Alta disponibilidade no Microsoft Azure: entendendo o funcionamento de Regiões e Availability Zones!](https://www.youtube.com/watch?v=w6QSz6zEiZ0) (Canal dotNET) |

### Nível 1: Configuração Inicial
_Seu ambiente pronto e sob controle (Semana 1)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **1.1** Criar a conta gratuita | Ative a conta grátis com crédito inicial e serviços gratuitos. | Crie sua conta e confirme a assinatura no portal. | [Como criar sua conta na Microsoft Azure a nuvem da Microsoft](https://www.youtube.com/watch?v=xArRTmBs4E0) (Erudio) | [Criando e configurando a sua conta gratuita no Microsoft Azure](https://www.youtube.com/watch?v=f2ukNA9fnQA) (Windows com o Tio INALDO) |
| **1.2** Tour pelo Portal do Azure | Busca, favoritos, dashboards e Cloud Shell. | Personalize o dashboard e fixe seus serviços favoritos. | [Azure Fundamentals - Navegando no Portal](https://www.youtube.com/watch?v=ewIcJHC-VPA) (Ray Carneiro) | [Introdução à nuvem Microsoft Azure: Conceitos e visão geral do portal do Azure](https://www.youtube.com/watch?v=T1EyDSENeqM) (Shalom André 🎲) |
| **1.3** Assinaturas e grupos de recursos | Grupos de gerenciamento, assinaturas, grupos de recursos e recursos. | Crie o grupo de recursos rg-estudos-azure. | [ASSINATURAS E GRUPOS DE GERENCIAMENTO DO AZURE](https://www.youtube.com/watch?v=-wYGVqMzcVA) (Julio Arruda) | [Azure Fundamentals - Diretório, Assinaturas e grupos de recursos](https://www.youtube.com/watch?v=9Ef4yGOQY8E) (Ray Carneiro) |
| **1.4** Custos sob controle | Calculadora de preços, Cost Management, orçamentos e alertas. | Crie um orçamento mensal com alerta em 80%. | [Aula 01 - Módulo 03 \| Como Controlar Custos no Azure — Pricing Calculator, Cost Management e Tags](https://www.youtube.com/watch?v=AmgLYOxsog8) (DaenyTech) | [Como gerenciar seus custos de Azure com Cost Management](https://www.youtube.com/watch?v=_hVtcuDBm1I) (Raphael Andrade) |

## Fase 2: Básico (Níveis 2, 3 e 4)

### Nível 2: Identidade e Governança
_Quem acessa o quê, e com quais regras (Semana 2)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **2.1** Microsoft Entra ID (antigo Azure AD) | Identidades da organização: usuários e grupos. | Crie 2 usuários e 1 grupo de estudos. | [Como Planejar e implementar grupos no Microsoft Entra ID](https://www.youtube.com/watch?v=ueLioB4_Mko) (Microsoft 365 Expert) | [Como criar um usuário no Microsoft Azure](https://www.youtube.com/watch?v=h6Ypp3vbFCU) (PHS Brasil Consultoria em Informática) |
| **2.2** RBAC: acesso por funções | Proprietário, Colaborador, Leitor e os escopos de acesso. | Dê ao grupo a função Leitor no rg-estudos-azure. | [Como Gerenciar o Controle de acesso baseado em função (RBAC) no Azure](https://www.youtube.com/watch?v=rHvFJU5aAko) (Guilherme Maia) | [Microsoft Entra ID - Identidade no Azure: O Que a Maioria Dos Iniciantes Erra?](https://www.youtube.com/watch?v=048l58XA1NU) (Josue Vidal) |
| **2.3** MFA e Acesso Condicional | Proteja logins com autenticação multifator e políticas. | Ative o MFA na sua conta administradora. | [Habilitar MFA por acesso condicional](https://www.youtube.com/watch?v=TpWwXIn98T0) (DGL Oliveira) | [Acesso Condicional-Configurando MFA](https://www.youtube.com/watch?v=YPLaRMtl9Cc) (Azure Cloud Guard) |
| **2.4** Policy, Tags e Bloqueios | Regras automáticas, organização por tags e proteção contra exclusão. | Aplique a tag ambiente=estudo e um bloqueio de exclusão. | [Fundamentos de Azure: Policy, Lock e Tags](https://www.youtube.com/watch?v=m6f77qDuSJ0) (CooperaTI) | [Configurando Azure Policy #partiunuvem](https://www.youtube.com/watch?v=dWMb0qykjho) (Raphael Andrade) |

### Nível 3: Infraestrutura Essencial
_Computação, armazenamento e rede (Semana 3)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **3.1** Máquinas Virtuais | Crie VMs Windows ou Linux e conecte via RDP ou SSH. | Suba uma VM pequena, conecte e desligue ao terminar. | [Criando sua primeira VM no Azure \| Cloud Computing](https://www.youtube.com/watch?v=Hl3MOTc2DV0) (Raphael Andrade) | [Criando uma Máquina Virtual Linux com Chaves SSH no Azure \| Portal e Azure CLI Passo a Passo](https://www.youtube.com/watch?v=lwKFYnLcBCI) (CooperaTI) |
| **3.2** Storage Account: Blob e Files | Armazenamento de objetos e arquivos, camadas Hot, Cool e Archive. | Crie um contêiner Blob e envie um arquivo. | [Aula 14 (LAB 02) \| AZ-900 – Storage Account na Prática (Blob, File Share e Replicação)](https://www.youtube.com/watch?v=QWnk51iQJ10) (DaenyTech) | [Como armazenar arquivos no Azure Blob Storage](https://www.youtube.com/watch?v=ry4KxS_aT-I) (Guilherme Maia) |
| **3.3** Redes Virtuais: VNet e NSG | Sub-redes e grupos de segurança para controlar o tráfego. | Crie uma VNet com 2 sub-redes e uma regra NSG. | [Azure Network Security Groups (NSG)](https://www.youtube.com/watch?v=U1z23-dr5T0) (Raphael Andrade) | [Redes Virtuais no Azure (VNET)](https://www.youtube.com/watch?v=Y_nFLCGhKX4) (Cloud X Academy) |
| **3.4** Alta disponibilidade | Load Balancer, zonas de disponibilidade e VM Scale Sets. | Coloque 2 VMs atrás de um Load Balancer. | [Azure Load Balancer: Configurando a Alta disponibilidade de servidores na Nuvem](https://www.youtube.com/watch?v=x3L5dYqztAc) (Guilherme Maia) | [\[AULA\] Conjunto de Escala de Máquina Virtual no Azure](https://www.youtube.com/watch?v=mUD8Kauf-VE) (Guilherme Maia) |

### Nível 4: Aplicações e Dados
_Do servidor ao serviço gerenciado (Semana 4)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **4.1** App Service | Hospede sites e APIs sem gerenciar servidores. | Publique um site simples no plano gratuito F1. | [.NET - Publicando uma Web API no Azure](https://www.youtube.com/watch?v=9dqAOc2rJHw) (Jose Carlos Macoratti) | [SÉRIE AZURE APP SERVICES #02 - PUBLICANDO SUA PRIMEIRA APLICAÇÃO NO AZURE APP SERVICES](https://www.youtube.com/watch?v=BmXlRpRaXtU) (Azure na Prática) |
| **4.2** Azure SQL Database | Banco relacional gerenciado, com firewall e backups automáticos. | Crie um banco e consulte pelo editor do portal. | [Configurando o Azure SQL Database](https://www.youtube.com/watch?v=CIzs7KY3Jl4) (Raphael Andrade) | [Como criar banco de dados SQL do Azure sempre gratuito](https://www.youtube.com/watch?v=pn72xKChSJQ) (fabioms) |
| **4.3** Azure Functions | Código serverless disparado por eventos. | Crie uma função HTTP que responda Olá, Azure. | [CRIANDO UMA FUNCTION PELO PORTAL DO AZURE](https://www.youtube.com/watch?v=QE2_dWwzERo) (Azure na Prática) | [Apreendendo o Básico sobre Azure Functions em C# : Um Guia Inicial](https://www.youtube.com/watch?v=1G0ZtL1bvJk) (Daniel Jesus) |
| **4.4** Contêineres: ACI e AKS | Rode contêineres e conheça o Kubernetes gerenciado. | Execute uma imagem pública no Container Instances. | [Do Build ao Deploy de Containers no Azure Container Instances](https://www.youtube.com/watch?v=MaTmUlDALfk) (Guilherme Maia) | [Como executar containers com serviços Azure](https://www.youtube.com/watch?v=hn9kmGSWJUQ) (Fabricio Veronez) |

## Fase 3: Intermediário (Níveis 5, 6 e 7)

### Nível 5: Automação e DevOps
_Faça uma vez, repita com código (Semana 5)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **5.1** Cloud Shell e Azure CLI | Gerencie o Azure pela linha de comando no navegador. | Crie um grupo de recursos com az group create. | [Como usar o Shell e CLI no Azure](https://www.youtube.com/watch?v=kLa_cfx0Ww8) (Guilherme Maia) | [Azure CLI: Dicas Essenciais](https://www.youtube.com/watch?v=rmhAGQR8nZ8) (UpperStack) |
| **5.2** Azure PowerShell | Automatize tarefas com o módulo Az do PowerShell. | Liste suas VMs com Get-AzVM. | [Azure - \[LAB10\] - Criando Máquina Virtual com PowerShell de forma Simples e Prática](https://www.youtube.com/watch?v=NA5X7YCOC1M) (Aprendendo Cloud) | [Descomplicando o Azure PowerShell e CLI na nova infraestrutura - Parte 01](https://www.youtube.com/watch?v=HYYK01mAooQ) (Carlos Sigmund - Evolução TI - 4.0) |
| **5.3** Infraestrutura como Código | Descreva sua infraestrutura em arquivos: Bicep, ARM ou Terraform. | Crie uma Storage Account a partir de código. | [Azure Bicep: Como Criar uma Máquina Virtual com Infraestrutura como Código (IaC) \| Tutorial Completo](https://www.youtube.com/watch?v=OGzCLpOZ9gQ) (Iêso Dias) | [Minicurso Azure Bicep - Aula1: Introdução \| Guido Oliveira](https://www.youtube.com/watch?v=NcpMkPBnL2s) (Guido Oliveira) |
| **5.4** CI/CD com Azure DevOps | Pipelines que testam e publicam sua aplicação sozinhos. | Crie um pipeline que publique no App Service. | [Azure DevOps: Tudo o que você precisa saber para criar PIPELINES de CI/CD](https://www.youtube.com/watch?v=O_oZTQTHDrM) (Guilherme Maia) | [Criando um Pipeline de CI no @AzureDevOps \| Guia para Iniciantes](https://www.youtube.com/watch?v=zjKAG7JkPws) (Julio Arruda) |

### Nível 6: Operação e Segurança
_Monitorar, proteger e recuperar (Semana 6)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **6.1** Azure Monitor e Log Analytics | Métricas, logs, consultas KQL e alertas. | Crie um alerta de CPU acima de 80% na sua VM. | [Como monitorar suas VMs com Azure Monitor](https://www.youtube.com/watch?v=EkGnNXEHm5A) (Raphael Andrade) | [\[AZ-104\] Dominando o Monitoramento com Azure Monitor](https://www.youtube.com/watch?v=ug0lfuryVlU) (Code FC) |
| **6.2** Azure Backup | Cofre de Recovery Services, políticas e restauração. | Faça backup da VM e teste uma restauração. | [Azure Backup - Realizando backup de VMs e arquivos](https://www.youtube.com/watch?v=VwYyC1tzuww) (Raphael Andrade) | [\[AULA\] Descomplicando o Azure Backup](https://www.youtube.com/watch?v=y2ZBJRrRF8M) (Guilherme Maia) |
| **6.3** Azure Key Vault | Guarde senhas, chaves e certificados fora do código. | Armazene um segredo e leia-o pela CLI. | [DESCOMPLICANDO O AZURE KEY VAULT](https://www.youtube.com/watch?v=0uTY9JEZZKo) (Guilherme Maia) | [\[AULA\] AZURE KEY VAULT PASSO A PASSO](https://www.youtube.com/watch?v=DKfWV9pSgwk) (Guilherme Maia) |
| **6.4** Microsoft Defender for Cloud | Postura de segurança, Secure Score e recomendações. | Revise o Secure Score e corrija 1 recomendação. | [Desmistificando o Microsoft Defender for Cloud](https://www.youtube.com/watch?v=oeHVVScEbOE) (Canal da Cloud) | [Sua nuvem mais segura com Defender for Cloud](https://www.youtube.com/watch?v=OJtaI_niefY) (Fabricio Veronez) |

### Nível 7: Certificação e Próximos Passos
_Valide e mostre o que você aprendeu (Semanas 7 e 8)_

| Etapa | O que você aprende | Prática | Vídeo (YouTube) | Alternativo |
|---|---|---|---|---|
| **7.1** Revisão completa AZ-900 | Todos os fundamentos para a certificação Azure Fundamentals. | Faça um simulado e anote seus pontos fracos. | [Certifique-se AZ-900 - Azure Fundamentals](https://www.youtube.com/watch?v=TT-gJh8j-vc) (Raphael Andrade) | [\[MASTERCLASS AZ-900\] Treinamento completo para Certificação AZ-900](https://www.youtube.com/watch?v=pGocOJiXvnA) (Guilherme Maia) |
| **7.2** Preparatório AZ-104 | Identidade, rede, computação e monitoramento no nível administrador. | Refaça os laboratórios dos níveis 2 a 6 sem tutorial. | [Revisão prática AZ-104 - AO VIVO](https://www.youtube.com/watch?v=vkHZjrUd-qM) (Raphael Andrade) | [AZ-104 \| EP 1 \| Treinamento Oficial](https://www.youtube.com/watch?v=2qxa__U5oVU) (Canal da Cloud) |
| **7.3** Microsoft Learn e a prova | Trilhas gratuitas, ambiente de prática e como agendar o exame. | Monte seu plano de estudo e agende a prova. | [Como estudar e tirar sua 1ª certificação Azure de forma Gratuita](https://www.youtube.com/watch?v=OPxPFz2i3G4) (Mentoria Cloud) | [Passo a Passo: Agendamento, Preparação e Realização de uma Prova de Certificação Online da Microsoft](https://www.youtube.com/watch?v=Ur5DR5Vlj7s) (Robson Araujo) |
| **7.4** Projeto prático completo | Una aplicação, banco, rede, segurança e monitoramento. | Publique um projeto completo e registre no portfólio. | [\[AZURE PAAS\] Como Modernizar Aplicações no Azure 100% na prática](https://www.youtube.com/watch?v=hHMW180SUF4) (Guilherme Maia) | [Subindo Aplicação Do Zero no Azure](https://www.youtube.com/watch?v=HDD5yofvwCI) (UpperStack) |

---

Links verificados em 01/10/2026 pelo oEmbed do YouTube (vídeo público e existente).
Se algum vídeo sair do ar, use o link alternativo da mesma etapa.
