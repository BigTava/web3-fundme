import { network, deployments, ethers, getNamedAccounts } from "hardhat"
import { FundMe } from "../typechain-types"
import { ContractTransaction } from "ethers"

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe: FundMe = await ethers.getContract("FundMe", deployer)

    console.log("Funding...")
    const transactionResponse: ContractTransaction = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
