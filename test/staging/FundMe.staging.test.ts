import { assert } from "chai"
import { ethers, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { FundMe } from "../../typechain-types"
import { ContractTransaction } from "ethers"

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async function () {
          let fundMe: FundMe
          let deployer: SignerWithAddress

          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              fundMe = await ethers.getContract("FundMe", deployer.address)
          })

          it("Allows people to fund and withdraw", async function () {
              // Arrange
              let transactionResponse: ContractTransaction

              // Act
              transactionResponse = await fundMe.fund({
                  value: sendValue,
              })
              await transactionResponse.wait()

              transactionResponse = await fundMe.withdraw({
                  gasLimit: 100000,
              })
              await transactionResponse.wait()
              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )

              // Assert
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
