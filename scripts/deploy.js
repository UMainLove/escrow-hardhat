const fs = require('fs');
const path = require('path');
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const EscrowContract = await ethers.getContractFactory("EscrowContract");
  
  // Deploy as upgradeable and initialize with the escrow manager address
  const escrow = await upgrades.deployProxy(EscrowContract, [deployer.address], { initializer: 'initialize' });

  // Wait for the deployment transaction to be mined
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();

  console.log("EscrowContract deployed to:", escrowAddress);
  console.log("Escrow Manager set to:", deployer.address);

  // Save the addresses to a file
  const addressesDir = path.join(__dirname, '..', 'src', 'contracts');
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(addressesDir, 'contractAddress.json'),
    JSON.stringify({ 
      EscrowContract: escrowAddress,
      EscrowManager: deployer.address
    }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });