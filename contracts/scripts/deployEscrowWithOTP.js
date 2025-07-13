const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
const networkName = hre.network.name;
console.log(`Deploying EscrowWithOTP to network: ${networkName}`);

const Escrow = await hre.ethers.getContractFactory("EscrowWithOTP");
const escrow = await Escrow.deploy();
await escrow.waitForDeployment();

const escrowAddress = await escrow.getAddress();
console.log(`EscrowWithOTP deployed at: ${escrowAddress}`);

const deploymentPath = path.join(__dirname, "../deploy-info.json");
const abiDir = path.join(__dirname, "../public/abi");

const contractName = "EscrowWithOTP";
const artifact = await hre.artifacts.readArtifact(contractName);

// Load or initialize deploy-info.json
let deployInfo = {};
if (fs.existsSync(deploymentPath)) {
deployInfo = JSON.parse(fs.readFileSync(deploymentPath));
}

if (!deployInfo[networkName]) {
deployInfo[networkName] = {};
}

// Save address
deployInfo[networkName][contractName] = escrowAddress;
fs.writeFileSync(deploymentPath, JSON.stringify(deployInfo, null, 2));
console.log(`Address saved to: ${deploymentPath}`);

// Save ABI
if (!fs.existsSync(abiDir)) {
fs.mkdirSync(abiDir, { recursive: true });
}

const abiPath = path.join(abiDir, `${contractName}.json`);
fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
console.log(`ABI saved to: ${abiPath}`);
}

main().catch((error) => {
console.error(error);
process.exitCode = 1;
});