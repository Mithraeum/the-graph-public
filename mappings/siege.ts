import {ArmyLiquidated, ArmySiegeModified, BuildingRobbed} from "../generated/templates/Siege/Siege";
import {ArmyLiquidatedAction, ArmySiegeModifiedAction, BuildingRobbedAction, Siege} from "../generated/schema";
import {Siege as SiegeContract} from "../generated/templates/Siege/Siege";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleArmySiegeModified(event: ArmySiegeModified): void {
  let siegeEntity = Siege.load(event.address.toHex())!;
  siegeEntity.totalSiegePower = event.params.newTotalSiegePower;
  siegeEntity.save();

  const siegeContract = SiegeContract.bind(event.address);
  const relatedSettlement = siegeContract.relatedSettlement();

  const actionEntity = new ArmySiegeModifiedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.army = event.params.armyAddress;
  actionEntity.onSettlement = relatedSettlement;
  actionEntity.unitTypeIds = event.params.unitTypeIds;
  actionEntity.toAddIndication = event.params.toAddIndication;
  actionEntity.unitsAmounts = event.params.unitsAmounts;
  actionEntity.newRobberyMultiplier = event.params.newRobberyMultiplier;
  actionEntity.newTotalSiegePower = event.params.newTotalSiegePower;
  actionEntity.save();
}

export function handleBuildingRobbed(event: BuildingRobbed): void {
  const actionEntity = new BuildingRobbedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.building = event.params.buildingAddress;
  actionEntity.army = event.params.armyAddress;
  actionEntity.stolenAmount = event.params.stolenAmount;
  actionEntity.burnedAmount = event.params.burnedAmount;
  actionEntity.pointsSpent = event.params.pointsSpent;
  actionEntity.newRobberyPointsAmount = event.params.newRobberyPointsAmount;
  actionEntity.save();
}

export function handleArmyLiquidated(event: ArmyLiquidated): void {
  const actionEntity = new ArmyLiquidatedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.army = event.params.armyAddress;
  actionEntity.save();
}
