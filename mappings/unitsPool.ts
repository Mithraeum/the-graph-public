import {UnitsBought} from "../generated/templates/UnitsPool/UnitsPool";
import {UnitsBoughtAction, WorldStatistic} from "../generated/schema";
import {UnitsPool as UnitsPoolContract} from "../generated/templates/UnitsPool/UnitsPool";
import {Army as ArmyContract} from "../generated/templates/Army/Army";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleUnitsBought(event: UnitsBought): void {
    const armyContract = ArmyContract.bind(event.params.armyAddress);
    const worldAddress = armyContract.world().toHex();
    const worldStatistic = WorldStatistic.load(worldAddress)!;
    worldStatistic.totalHiredUnits = worldStatistic.totalHiredUnits.plus(event.params.boughtUnitsAmount);
    worldStatistic.save();

    const unitsPoolContract = UnitsPoolContract.bind(event.address);

    const actionEntity = new UnitsBoughtAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);
    actionEntity.army = event.params.armyAddress;
    actionEntity.spender = event.params.spender;
    actionEntity.boughtUnitsAmount = event.params.boughtUnitsAmount;
    actionEntity.spentTokensAmount = event.params.spentTokensAmount;
    actionEntity.unitTypeId = unitsPoolContract.unitTypeId();
    actionEntity.newUnitPrice = event.params.newUnitPrice;
    actionEntity.save();
}