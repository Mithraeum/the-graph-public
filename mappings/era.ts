import {Address, BigInt, ethereum, log} from "@graphprotocol/graph-ts";

import {Settlement as SettlementContract} from "../generated/templates/Era/Settlement"
import {
    Region,
    Settlement,
    Banner,
    Resource,
    Era,
    TileCapturingSystem,
    IncludedRegion,
    World,
    CrossErasMemory, CemPosition, Units, BuildingRobbedAction, SettlementRestoredAction
} from "../generated/schema";
import {
    ProsperityCreated,
    ResourceCreated,
    SettlementCreated,
    SettlementRestored,
    TileCapturingSystemCreated,
    UnitsCreated,
    WorkersCreated,
    RegionActivated
} from "../generated/templates/Era/Era";
import {
    Units as UnitsTemplate,
    Workers as WorkersTemplate,
    Resource as ResourceTemplate,
    Region as RegionTemplate,
    Settlement as SettlementTemplate,
    TileCapturingSystem as TileCapturingSystemTemplate
} from "../generated/templates";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleResourceCreated(event: ResourceCreated): void {
    ResourceTemplate.create(event.params.resourceAddress);

    const resourceEntity = new Resource(event.params.resourceAddress.toHex());
    resourceEntity.era = event.address.toHex();
    resourceEntity.resourceTypeId = event.params.resourceTypeId;
    resourceEntity.holdersCount = BigInt.fromI32(0);
    resourceEntity.save();
}

export function handleUnitsCreated(event: UnitsCreated): void {
    UnitsTemplate.create(event.params.unitsAddress);

    const unitsEntity = new Units(event.params.unitsAddress.toHex());
    unitsEntity.era = event.address.toHex();
    unitsEntity.unitTypeId = event.params.unitTypeId;
    unitsEntity.save();
}

export function handleWorkersCreated(event: WorkersCreated): void {
    WorkersTemplate.create(event.params.workersAddress);
}

export function handleProsperityCreated(event: ProsperityCreated): void {
    //todo if units handler is needed
}

export function handleTileCapturingSystemCreated(event: TileCapturingSystemCreated): void {
    TileCapturingSystemTemplate.create(event.params.tileCapturingSystemAddress);

    const tileCapturingSystemEntity = new TileCapturingSystem(event.params.tileCapturingSystemAddress.toHex());
    tileCapturingSystemEntity.era = event.address.toHex();
    tileCapturingSystemEntity.tileCapturingRecordsCount = BigInt.fromI32(0);
    tileCapturingSystemEntity.save();

    const eraEntity = Era.load(event.address.toHex())!;
    eraEntity.tileCapturingSystem = event.params.tileCapturingSystemAddress.toHex();
    eraEntity.save();
}

export function handleRegionActivated(event: RegionActivated): void {
    RegionTemplate.create(event.params.regionAddress);

    const regionEntity = new Region(event.params.regionAddress.toHex());
    regionEntity.era = event.address.toHex();
    regionEntity.includedRegion = event.params.regionId.toString();
    regionEntity.settlementsCount = BigInt.fromI32(0);
    regionEntity.save();

    const era = Era.load(event.address.toHex())!;
    era.activatedRegionsCount = era.activatedRegionsCount.plus(BigInt.fromI32(1));
    era.save();
}

export function handleSettlementCreated(event: SettlementCreated): void {
    SettlementTemplate.create(event.params.settlementAddress);

    const settlementEntity = new Settlement(event.params.settlementAddress.toHex());
    settlementEntity.region = event.params.regionAddress.toHex();
    settlementEntity.position = event.params.position;
    settlementEntity.buildingsCount = BigInt.fromI32(0);
    settlementEntity.currentGovernorsGeneration = BigInt.fromI32(0);
    settlementEntity.governorsCount = BigInt.fromI32(0);
    settlementEntity.producedCorruptionIndex = BigInt.fromI32(0);

    const regionEntity = Region.load(event.params.regionAddress.toHex())!;

    // bytes = keccak256("BASIC"), aka if user settlement it must have a banner
    if (event.params.assetTypeId.toHex().toLowerCase() == "0xdc0ae866100b2876ab26eb62a50ca2cd083944f439e6d78aab2fc402e669e9ee".toLowerCase()) {
        const settlementContract = SettlementContract.bind(event.params.settlementAddress);
        let callResult = settlementContract.try_bannerId();

        if (!callResult.reverted) {
            const banner = Banner.load(callResult.value.toString());
            if (banner != null) {
                settlementEntity.banner = callResult.value.toString();
                banner.settlement = event.params.settlementAddress.toHex();
                banner.save();
            }
        }

        regionEntity.settlementsCount = regionEntity.settlementsCount.plus(BigInt.fromI32(1));
        regionEntity.save();
    }

    settlementEntity.save();

    const eraEntity = Era.load(regionEntity.era)!;
    const worldEntity = World.load(eraEntity.world)!;
    const cemEntity = CrossErasMemory.load(worldEntity.crossErasMemory)!;

    // Store settlement in cem position
    let cemPositionEntity = CemPosition.load(event.params.position.toString());
    if (cemPositionEntity === null) {
        cemPositionEntity = new CemPosition(event.params.position.toString());
        cemPositionEntity.crossErasMemory = cemEntity.id;
    }

    const includedRegionEntity = IncludedRegion.load(regionEntity.includedRegion)!;
    cemPositionEntity.regionId = includedRegionEntity.regionId;
    cemPositionEntity.settlement = settlementEntity.id;
    cemPositionEntity.save();
}

export function handleSettlementRestored(event: SettlementRestored): void {
    const actionEntity = new SettlementRestoredAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.settlement = event.params.settlementAddress;
    actionEntity.position = event.params.position;
    actionEntity.save();
}