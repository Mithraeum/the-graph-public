import {
    CurrentEraNumberUpdated,
    GameEndTimeUpdated,
    GameBeginTimeUpdated,
    EraCreated,
    WorldInitialized,
} from "../generated/World/World";
import {
    Era,
    Geography,
    Registry,
    World,
    CrossErasMemory,
    Erc20ForBuyingSettlement,
    BannersContract,
    WorldStatistic,
    // RewardPool
} from "../generated/schema";
import {Era as EraTemplate} from "../generated/templates";
import {Address, BigInt} from "@graphprotocol/graph-ts";
import {World as WorldContract} from "../generated/World/World";

function getWorldCurrentEraNumber(worldAddress: string): BigInt {
    return WorldContract.bind(Address.fromString(worldAddress)).currentEraNumber();
}

export function handleWorldInitialized(event: WorldInitialized): void {
    const worldAddress = event.address.toHex();

    const erc20ForBuyingSettlementEntity = new Erc20ForBuyingSettlement(
        event.params.erc20ForBuyingSettlementAddress.toHex()
    );
    erc20ForBuyingSettlementEntity.world = worldAddress;
    erc20ForBuyingSettlementEntity.save();

    const registryEntity = new Registry(event.params.registryAddress.toHex());
    registryEntity.world = worldAddress;
    registryEntity.save();

    const bannersEntity = new BannersContract(event.params.bannersAddress.toHex().toLowerCase());
    bannersEntity.world = worldAddress;
    bannersEntity.bannersCount = BigInt.fromI32(0);
    bannersEntity.save();

    const geographyEntity = new Geography(event.params.geographyAddress.toHex());
    geographyEntity.world = worldAddress;
    geographyEntity.includedRegionsCount = BigInt.fromI32(0);
    geographyEntity.save();

    const crossErasMemory = new CrossErasMemory(event.params.crossErasMemoryAddress.toHex());
    crossErasMemory.world = worldAddress;
    crossErasMemory.save();

    const worldStatistic = new WorldStatistic(worldAddress);
    worldStatistic.world = worldAddress;
    worldStatistic.totalCreatedSettlements = BigInt.fromI32(0);
    worldStatistic.totalHiredWorkers = BigInt.fromI32(0);
    worldStatistic.totalHiredUnits = BigInt.fromI32(0);
    worldStatistic.save();

    // const rewardPoolEntity = new RewardPool(event.params.rewardPoolAddress.toHex());
    // rewardPoolEntity.world = worldAddress;
    // rewardPoolEntity.toBeRepaidTokenAmount = RewardPoolContract.bind(event.params.rewardPoolAddress).toBeRepaidTokenAmount();
    // rewardPoolEntity.lastSyncedTokenBalance = RewardPoolContract.bind(event.params.rewardPoolAddress).lastSyncedTokenBalance();
    //
    // // It is impossible to query eth balance therefore it is set to zero, this should not cause any problem since
    // // eth balance will be updated by the next 'EthBalanceUpdated' event in this rewardPool
    // rewardPoolEntity.ethBalance = BigInt.fromI32(0);
    // rewardPoolEntity.save();

    const worldEntity = new World(worldAddress);
    worldEntity.erc20ForBuyingSettlement = erc20ForBuyingSettlementEntity.id;
    worldEntity.registry = registryEntity.id;
    worldEntity.bannersContract = bannersEntity.id;
    worldEntity.geography = geographyEntity.id;
    worldEntity.crossErasMemory = crossErasMemory.id;
    worldEntity.gameStartTime = BigInt.fromI32(0);
    worldEntity.gameFinishTime = BigInt.fromI32(0);
    worldEntity.erasCount = BigInt.fromI32(0);
    worldEntity.currentEraNumber = getWorldCurrentEraNumber(worldAddress);
    worldEntity.worldStatistic = worldStatistic.id;
    worldEntity.rewardPool = event.params.rewardPoolAddress;
    worldEntity.save();
}

export function handleGameBeginTimeUpdated(event: GameBeginTimeUpdated): void {
    const worldEntity = World.load(event.address.toHex())!;
    worldEntity.gameStartTime = event.params.newBeginTime;
    worldEntity.save();
}

export function handleGameEndTimeUpdated(event: GameEndTimeUpdated): void {
    const worldEntity = World.load(event.address.toHex())!;
    worldEntity.gameFinishTime = event.params.newEndTime;
    worldEntity.save();
}

export function handleEraCreated(event: EraCreated): void {
    EraTemplate.create(event.params.newEraAddress);

    const eraEntity = new Era(event.params.newEraAddress.toHex());
    eraEntity.world = event.address.toHex();
    eraEntity.eraNumber = event.params.newEraNumber;
    eraEntity.activatedRegionsCount = BigInt.fromI32(0);
    eraEntity.save();

    const worldEntity = World.load(event.address.toHex())!;
    worldEntity.erasCount = worldEntity.erasCount.plus(BigInt.fromI32(1));
    worldEntity.save();
}

export function handleCurrentEraNumberUpdated(event: CurrentEraNumberUpdated): void {
    const worldEntity = World.load(event.address.toHex())!;
    worldEntity.currentEraNumber = event.params.newEraNumber;
    worldEntity.save();
}
