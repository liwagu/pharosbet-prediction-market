# PharosBet 完整使用指南 & 测试方案

> **项目**: PharosBet — 去中心化预测市场  
> **GitHub**: [liwagu/pharosbet-prediction-market](https://github.com/liwagu/pharosbet-prediction-market)  
> **网络**: Pharos Atlantic Testnet (Chain ID: 688689)

---

## 一、本地环境搭建

### 1.1 前置依赖

在你的本地机器上需要安装以下工具：

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| pnpm | v8+ | `npm install -g pnpm` |
| Foundry (forge) | 最新 | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| MetaMask | 最新 | Chrome/Firefox 浏览器扩展 |
| Git | 任意 | 系统自带或 [git-scm.com](https://git-scm.com) |

### 1.2 克隆并启动项目

```bash
# 1. 克隆仓库
git clone https://github.com/liwagu/pharosbet-prediction-market.git
cd pharosbet-prediction-market

# 2. 安装前端依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

启动后浏览器访问 `http://localhost:3000`，你会看到 PharosBet 首页。

### 1.3 编译智能合约（可选，如果你要重新部署）

```bash
# 安装 Foundry（如果还没装）
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup

# 编译合约
cd contracts
forge build
cd ..
```

---

## 二、MetaMask 钱包连接

### 2.1 "Connect Wallet" 连的是什么？

**Connect Wallet 连接的是你的 MetaMask 浏览器钱包**。MetaMask 是一个浏览器扩展，充当你在区块链上的"身份证 + 银行账户"。在 Web3 项目中，**钱包就是你的账户**，不需要传统的用户名/密码登录。

### 2.2 配置 MetaMask 连接 Pharos 测试网

**第一步：安装 MetaMask**

前往 [metamask.io](https://metamask.io) 安装 Chrome 或 Firefox 扩展，创建或导入钱包。

**第二步：导入你的测试私钥**

在 MetaMask 中点击右上角头像 → "Import Account" → 选择 "Private Key" → 粘贴你的私钥：

```
7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2
```

> **安全提醒**：这是测试网私钥，仅用于测试。永远不要在主网使用已暴露的私钥。

**第三步：添加 Pharos Atlantic 测试网**

在 MetaMask 中点击左上角网络选择器 → "Add Network" → "Add a network manually"，填入以下信息：

| 字段 | 值 |
|------|-----|
| Network Name | Pharos Atlantic Testnet |
| RPC URL | `https://atlantic.dplabs-internal.com` |
| Chain ID | `688689` |
| Currency Symbol | `PHAR` |
| Block Explorer URL | `https://atlantic.pharosscan.xyz` |

点击 "Save"，然后切换到 "Pharos Atlantic Testnet" 网络。

**第四步：确认余额**

切换网络后，你应该能看到你的 PHAR 余额（约 10 PHAR 减去部署和模拟消耗的 gas）。如果余额不足，前往 [Pharos Faucet](https://faucet.pharosnetwork.xyz) 领取测试币。

### 2.3 在网站上连接钱包

1. 打开 `http://localhost:3000`（本地）或部署后的网址
2. 点击右上角 **"Connect Wallet"** 按钮
3. MetaMask 弹窗会请求连接授权 → 点击 **"Connect"**
4. 如果当前网络不是 Pharos，网站会提示你切换网络 → 点击 **"Switch Network"**
5. 连接成功后，右上角会显示你的钱包地址和 PHAR 余额

---

## 三、已部署合约地址

以下合约已经部署在 Pharos Atlantic Testnet 上，前端已配置好这些地址：

| 合约 | 地址 | 用途 |
|------|------|------|
| SimpleOracle | `0x2A079770f114a0D99799Dc81b172670a28a5c094` | 市场结算裁决 |
| PredictionMarketFactory | `0x438D2864035e9FBec492762b0D01121E843073c5` | 创建和管理市场 |
| Sample BTC Market | `0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9` | 示例市场（BTC $150K） |

---

## 四、完整测试方案

以下测试案例覆盖了状态转换图中的**所有状态和路径**。测试分为两部分：**网页端操作**（通过浏览器 + MetaMask）和**命令行操作**（通过 cast/node 脚本直接调用合约）。

### 4.1 阶段一：市场浏览与创建

#### TC-01: 浏览市场列表

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>START → BROWSE → MARKET_ACTIVE</td>
</tr>
<tr>
<td>前置条件</td>
<td>网站已启动，MetaMask 已连接</td>
</tr>
<tr>
<td>操作步骤</td>
<td>1. 打开首页 http://localhost:3000<br/>2. 向下滚动到市场列表<br/>3. 点击不同分类标签（All / Crypto / Politics / Sports / Tech）<br/>4. 观察市场卡片是否正确显示</td>
</tr>
<tr>
<td>预期结果</td>
<td>首页显示 hero 区域和市场列表。第一个卡片是链上真实市场 "Will BTC exceed $150,000 by end of 2026?"，显示 YES/NO 价格、交易量 0.6131 PHAR、5个参与者。分类筛选正常工作。</td>
</tr>
<tr>
<td>验证要点</td>
<td>链上市场数据实时从 Pharos 读取，非 mock 数据</td>
</tr>
</table>

#### TC-02: 创建新市场

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>CREATE_DECISION → DEFINE_EVENT → DEPLOY_MARKET → SEED_LIQUIDITY → MARKET_ACTIVE</td>
</tr>
<tr>
<td>前置条件</td>
<td>MetaMask 已连接，余额 >= 0.5 PHAR</td>
</tr>
<tr>
<td>操作步骤（网页端）</td>
<td>1. 点击导航栏 "+ Create"<br/>2. 填写 Question: "Will ETH reach $10,000 by 2026?"<br/>3. 填写 Resolution Criteria: "Resolves YES if ETH/USD exceeds $10,000 on Binance before Dec 31 2026"<br/>4. 选择 Category: Crypto<br/>5. 设置 End Date: 选择一个未来日期（至少1小时后）<br/>6. 填写 Tags: ethereum, eth, price<br/>7. 点击 "Create Market"<br/>8. MetaMask 弹窗确认交易 → 点击 "Confirm"<br/>9. 等待交易确认</td>
</tr>
<tr>
<td>操作步骤（命令行替代）</td>
<td>如果网页端创建遇到问题，用命令行直接创建：<br/><code>export PATH="$HOME/.foundry/bin:$PATH"</code><br/><code>cast send 0x438D2864035e9FBec492762b0D01121E843073c5 "createMarket(string,string,string,uint256)" "Will ETH reach 10000 by 2026?" "Resolves YES if ETH/USD exceeds 10000 on Binance" "crypto" $(date -d "+30 days" +%s) --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易成功后，新市场出现在首页列表中，初始价格 YES 50% / NO 50%，交易量 0，参与者 0</td>
</tr>
<tr>
<td>验证要点</td>
<td>在 Pharos Explorer 上可以看到 MarketCreated 事件</td>
</tr>
</table>

### 4.2 阶段二：交易参与

> **注意**：以下测试均针对已部署的 BTC 市场 `0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9`

#### TC-03: 买入 YES 份额

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>TRADE_DECISION → BUY_YES → HOLDING_YES</td>
</tr>
<tr>
<td>前置条件</td>
<td>MetaMask 已连接，余额 >= 0.1 PHAR</td>
</tr>
<tr>
<td>操作步骤（网页端）</td>
<td>1. 点击 BTC 市场卡片进入详情页<br/>2. 在右侧 Trade 面板点击绿色 "YES" 按钮<br/>3. 在 Amount 输入框输入 0.1（或点击快捷按钮）<br/>4. 点击 "Buy YES Shares"<br/>5. MetaMask 弹窗 → 确认交易<br/>6. 等待交易确认</td>
</tr>
<tr>
<td>操作步骤（命令行）</td>
<td><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "buyYes()" --value 0.1ether --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易成功。YES 价格上升，NO 价格下降（AMM 自动调价）。你的 PHAR 余额减少 0.1，获得 YES 份额。</td>
</tr>
<tr>
<td>验证（命令行）</td>
<td><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "yesShares(address)" 0xD144F65b252d8282f6F3A9C9c095F61675B511D1 --rpc-url https://atlantic.dplabs-internal.com</code><br/>返回值应 > 0</td>
</tr>
</table>

#### TC-04: 买入 NO 份额

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>TRADE_DECISION → BUY_NO → HOLDING_NO</td>
</tr>
<tr>
<td>前置条件</td>
<td>MetaMask 已连接，余额 >= 0.1 PHAR</td>
</tr>
<tr>
<td>操作步骤（网页端）</td>
<td>1. 在市场详情页 Trade 面板点击红色 "NO" 按钮<br/>2. 输入 Amount: 0.1<br/>3. 点击 "Buy NO Shares"<br/>4. MetaMask 确认交易</td>
</tr>
<tr>
<td>操作步骤（命令行）</td>
<td><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "buyNo()" --value 0.1ether --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易成功。NO 价格上升，YES 价格下降。获得 NO 份额。</td>
</tr>
<tr>
<td>验证（命令行）</td>
<td><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "noShares(address)" 0xD144F65b252d8282f6F3A9C9c095F61675B511D1 --rpc-url https://atlantic.dplabs-internal.com</code></td>
</tr>
</table>

#### TC-05: 卖出 YES 份额

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>HOLDING_YES → SELL → GOT_ETH</td>
</tr>
<tr>
<td>前置条件</td>
<td>已完成 TC-03，持有 YES 份额</td>
</tr>
<tr>
<td>操作步骤（命令行）</td>
<td>先查询你持有多少 YES 份额：<br/><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "yesShares(address)" 0xD144F65b252d8282f6F3A9C9c095F61675B511D1 --rpc-url https://atlantic.dplabs-internal.com</code><br/><br/>假设返回 50000000000000000 (0.05 ether 的份额)，卖出一半：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "sellYes(uint256)" 25000000000000000 --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易成功。PHAR 余额增加（扣除 2% 手续费后的金额）。YES 份额减少。YES 价格下降。</td>
</tr>
<tr>
<td>验证</td>
<td>查询余额变化和份额变化</td>
</tr>
</table>

#### TC-06: 卖出 NO 份额

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>HOLDING_NO → SELL → GOT_ETH</td>
</tr>
<tr>
<td>前置条件</td>
<td>已完成 TC-04，持有 NO 份额</td>
</tr>
<tr>
<td>操作步骤（命令行）</td>
<td>先查询 NO 份额：<br/><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "noShares(address)" 0xD144F65b252d8282f6F3A9C9c095F61675B511D1 --rpc-url https://atlantic.dplabs-internal.com</code><br/><br/>卖出（替换为实际份额数量）：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "sellNo(uint256)" YOUR_SHARES_AMOUNT --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易成功。PHAR 余额增加。NO 份额减少。NO 价格下降。</td>
</tr>
</table>

#### TC-07: 批量模拟交易（做市商 + 多用户）

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>TRADE_DECISION → BUY_YES/BUY_NO (循环多次) → HOLDING</td>
</tr>
<tr>
<td>前置条件</td>
<td>余额 >= 2 PHAR</td>
</tr>
<tr>
<td>操作步骤</td>
<td>使用模拟脚本批量生成交易：<br/><code>cd pharosbet-prediction-market</code><br/><code>PRIVATE_KEY=7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2 MARKET=0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 USERS=5 FUND_AMOUNT=0.1 MIN_BET=0.01 MAX_BET=0.05 DELAY_MS=1000 YES_BIAS=0.7 node scripts/simulate.mjs</code></td>
</tr>
<tr>
<td>参数说明</td>
<td>USERS=5 创建5个随机钱包<br/>FUND_AMOUNT=0.1 每个钱包充 0.1 PHAR<br/>MIN_BET=0.01 / MAX_BET=0.05 每笔下注范围<br/>YES_BIAS=0.7 表示 70% 概率买 YES</td>
</tr>
<tr>
<td>预期结果</td>
<td>控制台输出每笔交易详情，最后显示总参与者数、总交易量、最终 YES/NO 价格。刷新网页可看到更新后的数据。</td>
</tr>
</table>

### 4.3 阶段三：社交分享

#### TC-08: 分享到 Twitter/X

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>TRADE_DECISION → SHARE</td>
</tr>
<tr>
<td>操作步骤</td>
<td>1. 在市场详情页点击 "Share" 按钮（或底部 "X / Twitter" 按钮）<br/>2. 弹出新窗口/标签页，跳转到 Twitter 发推界面<br/>3. 预填文案包含市场问题和链接</td>
</tr>
<tr>
<td>预期结果</td>
<td>Twitter 编辑框预填内容类似：<br/>"I'm predicting on 'Will BTC exceed $150,000 by end of 2026?' — YES 50% / NO 49% 🔮 Join the prediction on PharosBet! [链接]"</td>
</tr>
</table>

#### TC-09: 分享到 Telegram

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>1. 在市场详情页点击 "Telegram" 按钮<br/>2. 跳转到 Telegram 分享界面</td>
</tr>
<tr>
<td>预期结果</td>
<td>Telegram 分享弹窗打开，包含市场链接和描述</td>
</tr>
</table>

#### TC-10: 复制链接

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>1. 在市场详情页点击复制图标按钮<br/>2. 粘贴到任意文本框验证</td>
</tr>
<tr>
<td>预期结果</td>
<td>剪贴板包含当前市场的 URL，如 http://localhost:3000/market/chain-0</td>
</tr>
</table>

### 4.4 阶段四：市场结算（最关键的测试）

#### TC-11: 路径 A — Oracle 结算（emergencyResolve）

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>MARKET_ENDED → ORACLE_SUBMIT → ORACLE_RESOLVED → CLAIM_NORMAL → FINAL_SETTLED</td>
</tr>
<tr>
<td>前置条件</td>
<td>你是 Oracle admin（部署者），市场有交易</td>
</tr>
<tr>
<td>步骤 1: 查看市场当前状态</td>
<td><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "status()" --rpc-url https://atlantic.dplabs-internal.com</code><br/>返回 0 = Active, 2 = Resolved</td>
</tr>
<tr>
<td>步骤 2: Oracle 紧急结算（结果=YES）</td>
<td><code>cast send 0x2A079770f114a0D99799Dc81b172670a28a5c094 "emergencyResolve(address,uint8)" 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 1 --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code><br/><br/>参数说明：第一个参数是市场地址，第二个参数 1=YES, 2=NO</td>
</tr>
<tr>
<td>步骤 3: 验证市场已结算</td>
<td><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "status()" --rpc-url https://atlantic.dplabs-internal.com</code><br/>应返回 2 (Resolved)<br/><br/><code>cast call 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "resolvedOutcome()" --rpc-url https://atlantic.dplabs-internal.com</code><br/>应返回 1 (Yes)</td>
</tr>
<tr>
<td>步骤 4: 赢方领取奖池</td>
<td>如果你持有 YES 份额（TC-03 中买入的），领取奖金：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "claimWinnings()" --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>claimWinnings 成功，你的 PHAR 余额增加（按你持有的 YES 份额占总 YES 份额的比例分配奖池）</td>
</tr>
<tr>
<td>验证</td>
<td>查询余额变化：<br/><code>cast balance 0xD144F65b252d8282f6F3A9C9c095F61675B511D1 --rpc-url https://atlantic.dplabs-internal.com</code></td>
</tr>
</table>

#### TC-12: 路径 A — Oracle 结算（正常多签流程）

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>ORACLE_SUBMIT (reportOutcome) → 等待争议期 → finalizeResolution</td>
</tr>
<tr>
<td>前置条件</td>
<td>需要一个新的未结算市场（先用 TC-02 创建一个新市场）</td>
</tr>
<tr>
<td>步骤 1: 创建新市场</td>
<td><code>cast send 0x438D2864035e9FBec492762b0D01121E843073c5 "createMarket(string,string,string,uint256)" "Will SOL reach 500 in 2026?" "Resolves YES if SOL/USD exceeds 500" "crypto" $(echo $(($(date +%s) + 86400))) --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code><br/><br/>记下返回的新市场地址（从 logs 中解析，或查看 explorer）</td>
</tr>
<tr>
<td>步骤 2: 在新市场买入一些份额</td>
<td><code>cast send NEW_MARKET_ADDRESS "buyYes()" --value 0.05ether --rpc-url https://atlantic.dplabs-internal.com --private-key YOUR_KEY</code></td>
</tr>
<tr>
<td>步骤 3: Reporter 提交结果</td>
<td><code>cast send 0x2A079770f114a0D99799Dc81b172670a28a5c094 "reportOutcome(address,uint8)" NEW_MARKET_ADDRESS 1 --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>步骤 4: 等待争议期（1小时）后 Finalize</td>
<td>等待1小时后执行：<br/><code>cast send 0x2A079770f114a0D99799Dc81b172670a28a5c094 "finalizeResolution(address)" NEW_MARKET_ADDRESS --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code><br/><br/>注意：如果在争议期内执行会报错 "Dispute period active"</td>
</tr>
<tr>
<td>步骤 5: 领取奖金</td>
<td><code>cast send NEW_MARKET_ADDRESS "claimWinnings()" --rpc-url https://atlantic.dplabs-internal.com --private-key YOUR_KEY</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>完整的多签 Oracle 流程：报告 → 争议期 → 确认 → 领奖</td>
</tr>
</table>

> **提示**：对于 hackathon demo，推荐使用 `emergencyResolve`（TC-11），因为它跳过了1小时争议期，可以即时演示完整流程。

#### TC-13: 结算失败案例 — 输方尝试领奖

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>CLAIM_NORMAL 失败路径</td>
</tr>
<tr>
<td>前置条件</td>
<td>TC-11 已完成（市场已结算为 YES），你同时持有 NO 份额</td>
</tr>
<tr>
<td>操作步骤</td>
<td>如果你只持有 NO 份额的钱包尝试领奖：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "claimWinnings()" --rpc-url https://atlantic.dplabs-internal.com --private-key LOSING_SIDE_KEY</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "No winning shares"</td>
</tr>
</table>

#### TC-14: 重复领奖

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>CLAIM_NORMAL 重复调用</td>
</tr>
<tr>
<td>前置条件</td>
<td>TC-11 步骤4 已完成（已领过奖）</td>
</tr>
<tr>
<td>操作步骤</td>
<td>再次调用 claimWinnings：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "claimWinnings()" --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "Already claimed"</td>
</tr>
</table>

### 4.5 边界与异常测试

#### TC-15: 市场到期后尝试交易

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>对应状态</td>
<td>EXPIRY_CHECK → MARKET_ENDED（交易应被拒绝）</td>
</tr>
<tr>
<td>操作步骤</td>
<td>对已结算的 BTC 市场尝试买入：<br/><code>cast send 0x488AeEfE0EAdf1B90a03ABf538D71be21Fa455d9 "buyYes()" --value 0.01ether --rpc-url https://atlantic.dplabs-internal.com --private-key 7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "Market not active"</td>
</tr>
</table>

#### TC-16: 零金额交易

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>对活跃市场发送 0 ETH 买入：<br/><code>cast send ACTIVE_MARKET "buyYes()" --value 0 --rpc-url https://atlantic.dplabs-internal.com --private-key YOUR_KEY</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "Must send PHAR"</td>
</tr>
</table>

#### TC-17: 卖出超过持有量

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td><code>cast send ACTIVE_MARKET "sellYes(uint256)" 999999999999999999999999 --rpc-url https://atlantic.dplabs-internal.com --private-key YOUR_KEY</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "Insufficient shares"</td>
</tr>
</table>

#### TC-18: 非 Oracle 尝试结算

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>用一个非 admin 的私钥调用 emergencyResolve：<br/><code>cast send 0x2A079770f114a0D99799Dc81b172670a28a5c094 "emergencyResolve(address,uint8)" MARKET_ADDRESS 1 --rpc-url https://atlantic.dplabs-internal.com --private-key RANDOM_PRIVATE_KEY</code></td>
</tr>
<tr>
<td>预期结果</td>
<td>交易 revert，报错 "Only admin"</td>
</tr>
</table>

#### TC-19: 404 页面

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>访问 http://localhost:3000/some-random-page</td>
</tr>
<tr>
<td>预期结果</td>
<td>显示 404 页面，深色主题一致，有返回首页按钮</td>
</tr>
</table>

#### TC-20: 不存在的市场

<table header-row="true">
<tr>
<td>项目</td>
<td>内容</td>
</tr>
<tr>
<td>操作步骤</td>
<td>访问 http://localhost:3000/market/nonexistent-id</td>
</tr>
<tr>
<td>预期结果</td>
<td>显示 "Market not found" 提示或重定向到 404 页面</td>
</tr>
</table>

---

## 五、完整演示脚本（Hackathon Demo 用）

以下是一个可以在 5 分钟内完成的演示流程，覆盖核心路径：

```bash
# ===== 环境变量 =====
export RPC=https://atlantic.dplabs-internal.com
export KEY=7ab322ab4c9fc0df45bf8ca2a2929d4e93e25d9cadec74b6af96dee00f5d63a2
export ORACLE=0x2A079770f114a0D99799Dc81b172670a28a5c094
export FACTORY=0x438D2864035e9FBec492762b0D01121E843073c5
export WALLET=0xD144F65b252d8282f6F3A9C9c095F61675B511D1

# ===== Step 1: 查看余额 =====
echo "=== 钱包余额 ==="
cast balance $WALLET --rpc-url $RPC --ether

# ===== Step 2: 创建新市场 =====
echo "=== 创建市场 ==="
END_TIME=$(($(date +%s) + 600))  # 10分钟后到期（方便演示）
cast send $FACTORY \
  "createMarket(string,string,string,uint256)" \
  "Will the demo succeed?" \
  "Resolves YES if the hackathon demo completes successfully" \
  "tech" \
  $END_TIME \
  --rpc-url $RPC --private-key $KEY

# 获取新市场地址（查看最后一个市场）
MARKET_COUNT=$(cast call $FACTORY "getMarketCount()" --rpc-url $RPC)
echo "Total markets: $MARKET_COUNT"
NEW_MARKET=$(cast call $FACTORY "allMarkets(uint256)" $((MARKET_COUNT - 1)) --rpc-url $RPC)
echo "New market: $NEW_MARKET"

# ===== Step 3: 买入 YES =====
echo "=== 买入 YES 份额 ==="
cast send $NEW_MARKET "buyYes()" --value 0.05ether --rpc-url $RPC --private-key $KEY
echo "YES price: $(cast call $NEW_MARKET 'getYesPrice()' --rpc-url $RPC)%"
echo "NO price: $(cast call $NEW_MARKET 'getNoPrice()' --rpc-url $RPC)%"

# ===== Step 4: 买入 NO =====
echo "=== 买入 NO 份额 ==="
cast send $NEW_MARKET "buyNo()" --value 0.02ether --rpc-url $RPC --private-key $KEY
echo "YES price: $(cast call $NEW_MARKET 'getYesPrice()' --rpc-url $RPC)%"
echo "NO price: $(cast call $NEW_MARKET 'getNoPrice()' --rpc-url $RPC)%"

# ===== Step 5: Oracle 结算 (YES 赢) =====
echo "=== Oracle 结算: YES 赢 ==="
cast send $ORACLE "emergencyResolve(address,uint8)" $NEW_MARKET 1 --rpc-url $RPC --private-key $KEY
echo "Status: $(cast call $NEW_MARKET 'status()' --rpc-url $RPC)"
echo "Outcome: $(cast call $NEW_MARKET 'resolvedOutcome()' --rpc-url $RPC)"

# ===== Step 6: 领取奖金 =====
echo "=== 领取奖金 ==="
BALANCE_BEFORE=$(cast balance $WALLET --rpc-url $RPC --ether)
cast send $NEW_MARKET "claimWinnings()" --rpc-url $RPC --private-key $KEY
BALANCE_AFTER=$(cast balance $WALLET --rpc-url $RPC --ether)
echo "Balance before: $BALANCE_BEFORE PHAR"
echo "Balance after: $BALANCE_AFTER PHAR"

echo "=== DEMO COMPLETE ==="
```

---

## 六、测试覆盖矩阵

下表总结了所有测试案例与状态转换图的映射关系：

| 测试案例 | 状态转换路径 | 测试类型 | 工具 |
|----------|-------------|---------|------|
| TC-01 | START → BROWSE → MARKET_ACTIVE | 正常流程 | 网页 |
| TC-02 | CREATE_DECISION → DEFINE → DEPLOY → ACTIVE | 正常流程 | 网页 + cast |
| TC-03 | TRADE → BUY_YES → HOLDING_YES | 正常流程 | 网页 + cast |
| TC-04 | TRADE → BUY_NO → HOLDING_NO | 正常流程 | 网页 + cast |
| TC-05 | HOLDING_YES → SELL → GOT_ETH | 正常流程 | cast |
| TC-06 | HOLDING_NO → SELL → GOT_ETH | 正常流程 | cast |
| TC-07 | 多用户批量交易 | 压力测试 | simulate.mjs |
| TC-08 | SHARE → Twitter | 社交分享 | 网页 |
| TC-09 | SHARE → Telegram | 社交分享 | 网页 |
| TC-10 | SHARE → Copy Link | 社交分享 | 网页 |
| TC-11 | ORACLE → emergencyResolve → CLAIM | 核心结算 | cast |
| TC-12 | ORACLE → reportOutcome → finalize → CLAIM | 完整 Oracle | cast |
| TC-13 | 输方 CLAIM 失败 | 异常测试 | cast |
| TC-14 | 重复 CLAIM 失败 | 异常测试 | cast |
| TC-15 | 到期后交易失败 | 边界测试 | cast |
| TC-16 | 零金额交易失败 | 边界测试 | cast |
| TC-17 | 超额卖出失败 | 边界测试 | cast |
| TC-18 | 非 Oracle 结算失败 | 权限测试 | cast |
| TC-19 | 404 页面 | UI 测试 | 网页 |
| TC-20 | 不存在的市场 | UI 测试 | 网页 |

> **路径 B（市场共识结算）和路径 C（强制兑现 outcome-force）** 目前在合约中尚未实现，属于论文扩展功能。当前 MVP 实现了路径 A（Oracle 结算）和路径 D 的基础版本（持有两方份额时可分别卖出）。这些扩展功能的设计方案已在 `docs/integration_design.md` 中详细描述。

---

## 七、常见问题

**Q: MetaMask 弹窗没出现？**
确保 MetaMask 扩展已启用，当前网络是 Pharos Atlantic Testnet (Chain ID: 688689)。

**Q: 交易一直 pending？**
Pharos 测试网偶尔会慢，等待 30 秒。如果超过 1 分钟，可能是 gas 不足或 nonce 问题，尝试在 MetaMask 中 "Speed Up" 或 "Cancel" 交易。

**Q: cast 命令找不到？**
运行 `export PATH="$HOME/.foundry/bin:$PATH"` 或重新安装 Foundry。

**Q: 余额不足？**
前往 [Pharos Faucet](https://faucet.pharosnetwork.xyz) 领取更多测试币。

**Q: 网页上看不到链上市场？**
检查 `client/src/lib/contracts.ts` 中的 `FACTORY_ADDRESS` 是否正确，以及 `PHAROS_RPC` 是否可访问。
