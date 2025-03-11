import {ethers} from "ethers";
import {MithraeumConfigKeys, mithraeumConfigs} from "@mithraeum/mithraeum-core-contracts/mithraeum.config";

const yaml = require("js-yaml");
const fs = require("fs");

function isZeroAddress(address: string) {
    return address === ethers.ZeroAddress;
}

function patchDeploymentData(
    dataSource: any,
    configName: string,
    entityName: string
) {
    const file = fs.readFileSync(`../mithraeum-core-contracts/deployments/${configName}/${entityName}.json`);
    const parsedFile = JSON.parse(file);
    dataSource.source.address = parsedFile.address;
    dataSource.source.startBlock = parsedFile.receipt.blockNumber;
    console.log(`Patched ${dataSource.name} with address=${parsedFile.address}, startBlock=${parsedFile.receipt.blockNumber}`);
}

function patchNetwork(yamlDocument: any, network: string) {
    yamlDocument.dataSources.forEach((dataSource: any) => {
        dataSource.network = network;
    });
    yamlDocument.templates.forEach((template: any) => {
        template.network = network;
    });

    console.log(`Networks patched to ${network}`);
}

function addOptionalErc20ForSettlementPurchaseDataSource(
    yamlDocument: any,
    configName: string,
    network: string
) {
    const mithraeumConfig = mithraeumConfigs[configName as MithraeumConfigKeys];
    if (mithraeumConfig == undefined) {
        throw new Error(`UNKNOWN_CONFIG_NAME=${configName}`);
    }

    // Remove old 'Erc20ForSettlementPurchase' if it exists
    yamlDocument.dataSources = yamlDocument.dataSources.filter((dataSource: any) => dataSource.name !== 'Erc20ForSettlementPurchase');

    if (mithraeumConfig.ERC20_FOR_SETTLEMENT_PURCHASE_ADDRESS === null || !isZeroAddress(mithraeumConfig.ERC20_FOR_SETTLEMENT_PURCHASE_ADDRESS)) {
        const erc20ForSettlementPurchaseAddress = mithraeumConfig.ERC20_FOR_SETTLEMENT_PURCHASE_ADDRESS === null
            ? JSON.parse(fs.readFileSync(`../mithraeum-core-contracts/deployments/${configName}/StubERC20ForSettlementPurchase.json`)).address
            : mithraeumConfig.ERC20_FOR_SETTLEMENT_PURCHASE_ADDRESS;

        const blockNumber = mithraeumConfig.ERC20_FOR_SETTLEMENT_PURCHASE_ADDRESS === null
            ? JSON.parse(fs.readFileSync(`../mithraeum-core-contracts/deployments/${configName}/StubERC20ForSettlementPurchase.json`)).receipt.blockNumber
            : 256863040//JSON.parse(fs.readFileSync(`../mithraeum-core-contracts/deployments/${configName}/RewardPoolProxy.json`)).receipt.blockNumber;
        // 256863040 value is block number when BLESS-A for arbitrum one token was deployed, valid only for arbitrum one

        const erc20ForSettlementPurchaseDataSource = {
            kind: 'ethereum/contract',
            name: 'Erc20ForSettlementPurchase',
            network: network,
            source: {
                address: erc20ForSettlementPurchaseAddress,
                abi: 'IERC20',
                startBlock: blockNumber
            },
            mapping: {
                kind: 'ethereum/events',
                apiVersion: '0.0.7',
                language: 'wasm/assemblyscript',
                entities: ["Erc20ForSettlementPurchaseTokenHolder"],
                abis: [
                    {
                        name: "IERC20",
                        file: "./artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json"
                    }
                ],
                eventHandlers: [
                    {
                        event: "Transfer(indexed address,indexed address,uint256)",
                        handler: "handleErc20ForSettlementPurchaseTransfer"
                    }
                ],
                file: './mappings/erc20ForSettlementPurchase.ts'
            }
        }

        yamlDocument.dataSources.push(erc20ForSettlementPurchaseDataSource);
    }
}

async function modifyYaml(yamlPath: string) {
    const configName = process.argv[2];
    const network = process.argv[3];

    const yamlDocument = yaml.load(fs.readFileSync(yamlPath, "utf8"));

    // This mapping will define which 'address' and 'startBlock' will be pasted into yaml file
    const dataSourceToDeploymentName: Record<string, string> = {
        'World': "WorldProxy",
        'Geography': "GeographyProxy",
        'Banner': "Banners",
        'Distributions': "Distributions",
    };

    for (const dataSource of yamlDocument.dataSources) {
        const deploymentName = dataSourceToDeploymentName[dataSource.name];
        if (deploymentName !== undefined) {
            patchDeploymentData(dataSource, configName, deploymentName);
        }
    }

    addOptionalErc20ForSettlementPurchaseDataSource(yamlDocument, configName, network);
    patchNetwork(yamlDocument, network);
    fs.writeFileSync(yamlPath, yaml.dump(yamlDocument));
    console.log("Subgraph yaml patched");
}

modifyYaml('./subgraph.yaml');
