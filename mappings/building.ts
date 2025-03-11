import {
    BasicProductionUpgraded,
    AdvancedProductionUpgraded,
    DistributionCreated, DistributedToShareHolder
} from "../generated/templates/Building/Building";

import {
    AdvancedProductionUpgradedAction,
    BasicProductionUpgradedAction,
    Building,
    DistributedToShareHolderAction,
    Distribution,
    ManeuveringBeganAction
} from "../generated/schema"
import {BigInt} from "@graphprotocol/graph-ts";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleDistributedToShareHolder(event: DistributedToShareHolder): void {
    const actionEntity = new DistributedToShareHolderAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.building = event.address;
    actionEntity.resourceTypeId = event.params.resourceTypeId;
    actionEntity.holder = event.params.holder;
    actionEntity.amount = event.params.amount;
    actionEntity.save();
}

export function handleBasicProductionUpgraded(event: BasicProductionUpgraded): void {
    const building = Building.load(event.address.toHex())!;

    building.basicProductionLevel = event.params.newBasicProductionLevel;
    building.level = building.level.plus(BigInt.fromI32(1));
    building.save();

    const actionEntity = new BasicProductionUpgradedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.building = event.address;
    actionEntity.newBasicProductionLevel = event.params.newBasicProductionLevel;
    actionEntity.save();
}

export function handleAdvancedProductionUpgraded(event: AdvancedProductionUpgraded): void {
    const building = Building.load(event.address.toHex())!;

    building.advancedProductionLevel = event.params.newAdvancedProductionLevel;
    building.level = building.level.plus(BigInt.fromI32(1));
    building.save();

    const actionEntity = new AdvancedProductionUpgradedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.building = event.address;
    actionEntity.newAdvancedProductionLevel = event.params.newAdvancedProductionLevel;
    actionEntity.save();
}

export function handleDistributionCreated(event: DistributionCreated): void {
    const building = Building.load(event.address.toHex())!;
    const oldDistributionId = building.activeDistribution;
    if (oldDistributionId != null) {
        const oldDistribution = Distribution.load(oldDistributionId!);
        if (oldDistribution != null) {
            oldDistribution.status = "INACTIVE";
            oldDistribution.save();
        }
    }

    const newDistributionId = event.params.newDistributionId;

    const distributionEntity = new Distribution(newDistributionId.toHex());
    distributionEntity.building = building.id;
    distributionEntity.distributionTokenHoldersCount = BigInt.fromI32(1);
    distributionEntity.status = "ACTIVE";
    distributionEntity.save();

    building.activeDistribution = distributionEntity.id;
    building.save();
}
