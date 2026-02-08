# Prediction Market Hackathon Project: Requirements

## 1. Functional Requirements

Functional requirements define the specific behaviors and functions of the system. For our decentralized prediction market, the following functional requirements are essential for the Minimum Viable Product (MVP).

| Feature | Description |
| :--- | :--- |
| **Market Creation** | Users must be able to create new prediction markets. This includes defining the market question (the event to be predicted), setting a resolution date and time, and specifying the possible outcomes (e.g., "Yes" or "No"). |
| **Trading** | Users must be able to buy and sell shares of the different outcomes in a prediction market. This will be facilitated by an Automated Market Maker (AMM) to ensure liquidity. All transactions will be conducted using a designated collateral token (e.g., a stablecoin like USDC). |
| **Settlement** | Upon the resolution of the event, the system must automatically settle the market. The prize pool, consisting of the collateral from the losing side, will be distributed to the holders of the winning outcome shares. |
| **Oracle Integration** | The platform needs a mechanism to determine the real-world outcome of the event. For the MVP, a centralized oracle controlled by an administrator will be used to report the outcome. The system will be designed with modularity to allow for future integration with decentralized oracle networks like Chainlink or UMA. |
| **Social Sharing** | To encourage user engagement and virality, the platform will include a social sharing feature. Users will be able to generate a unique link or a simple promotional image (a "poster") for each market, which can be easily shared on social media platforms. |

## 2. Non-Functional Requirements

Non-functional requirements define the quality attributes of the system. They are crucial for ensuring a good user experience and the long-term viability of the project.

| Attribute | Description |
| :--- | :--- |
| **User Experience (UX)** | The platform must offer a seamless and intuitive user experience, comparable to modern "Web2" applications. This includes a clean user interface, fast page loads, and straightforward navigation. |
| **Liquidity** | The system must be designed to handle the "long-tail" problem of prediction markets, where many markets have low trading volume. The use of an AMM is a key strategy to ensure that users can always trade, even in less popular markets. |
| **Scalability** | The application must be built to handle a growing number of users and transactions without performance degradation. Leveraging the high-throughput and low-latency capabilities of the Pharos blockchain is critical to achieving this. |
| **Security** | The smart contracts, which form the core of the prediction market, must be developed with the highest security standards to protect user funds from potential vulnerabilities and attacks. While a formal audit is out of scope for a hackathon, the code will be written with security best practices in mind. |
| **Decentralization** | The core logic of the prediction market should be decentralized and censorship-resistant. This means that once a market is created, it should operate autonomously on the blockchain without interference from any central party. |
