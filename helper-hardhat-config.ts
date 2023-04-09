export interface networkConfigItem {
    ethUsdPriceFeed?: string
    blockConfirmations?: number
}

export interface networkConfigInfo {
    [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    sepolia: {
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        blockConfirmations: 6,
    },
}

export const developmentChains = ["hardhat", "localhost"]
export const DECIMALS = "18"
export const INITIAL_PRICE = "2000000000000000000000" // 2000
