import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain-types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe: FundMe
          let mockV3Aggregator: MockV3Aggregator
          let deployer: SignerWithAddress
          const hre: HardhatRuntimeEnvironment = require("hardhat")

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])

              fundMe = await ethers.getContract("FundMe")
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              // we could be even more precise here by making sure exactly $50 works
              // but this is good enough for now
              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address
                  )
                  assert.equal(
                      response.toString(),
                      ethers.utils.parseEther("1").toString()
                  )
              })
              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer.address)
              })
          })

          describe("withdraw", function () {
              beforeEach(async () => {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") })
              })

              it("Withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("Allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({
                          value: ethers.utils.parseEther("1"),
                      })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          (
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              )
                          ).toString(),
                          "0"
                      )
                  }
              })

              it("Only allow the owner to withdraw", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]

                  // Act
                  const attackerConnectedContract = fundMe.connect(attacker)

                  // Assert
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(
                      attackerConnectedContract,
                      "FundMe__NotOwner"
                  )
              })
          })
      })
