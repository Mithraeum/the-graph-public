import {
  BuildingCreated,
  ArmyCreated,
  GovernorStatusChanged,
  GovernorsGenerationChanged,
  SiegeCreated, Destroyed
} from "../generated/templates/Settlement/Settlement";

import {
  Settlement,
  Building,
  Army,
  Governor,
  Siege,
  CemPosition,
  SettlementRestoredAction,
  GovernorStatusChangedAction,
  GovernorsGenerationChangedAction,
  DestroyedAction
} from "../generated/schema";
import {
  Building as BuildingTemplate,
  Army as ArmyTemplate,
  Siege as SiegeTemplate
} from "../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";
import {createBlockNumberAndLogIndex} from "./_actions";
import {Building as BuildingContract} from "../generated/templates/Building/Building";

export function handleBuildingCreated(event: BuildingCreated): void {
  BuildingTemplate.create(event.params.buildingAddress);

  const buildingContract = BuildingContract.bind(event.params.buildingAddress);

  const building = new Building(event.params.buildingAddress.toHex());
  building.settlement = event.address.toHex();
  building.buildingTypeId = event.params.buildingTypeId;
  building.level = buildingContract.getBuildingLevel();
  building.basicProductionLevel = buildingContract.basicProduction().getLevel();
  building.advancedProductionLevel = buildingContract.advancedProduction().getLevel();

  const settlement = Settlement.load(event.address.toHex())!;
  settlement.buildingsCount = settlement.buildingsCount.plus(BigInt.fromI32(1));
  settlement.save();

  building.save();
}

export function handleArmyCreated(event: ArmyCreated): void {
  ArmyTemplate.create(event.params.armyAddress);

  const army = new Army(event.params.armyAddress.toHex());

  const settlement = Settlement.load(event.address.toHex())!;
  army.currentSettlement = settlement.id;
  army.save();
}

export function handleSiegeCreated(event: SiegeCreated): void {
  SiegeTemplate.create(event.params.siegeAddress);

  const siege = new Siege(event.params.siegeAddress.toHex());

  const settlement = Settlement.load(event.address.toHex())!;
  siege.settlement = settlement.id;
  siege.totalSiegePower = BigInt.fromI32(0);
  siege.save();
}

export function handleGovernorStatusChanged(event: GovernorStatusChanged): void {
  const governorId = event.address.toHex() + '-' + event.params.currentGovernorsGeneration.toString() + '-' + event.params.governorAddress.toHex();

  let governorEntity = Governor.load(governorId);

  if (governorEntity == null) {
    governorEntity = new Governor(governorId);
    governorEntity.governorAddress = event.params.governorAddress;
    governorEntity.assignedTime = event.block.timestamp;
    governorEntity.assignedAtGeneration = event.params.currentGovernorsGeneration;
    governorEntity.assignedByAddress = event.params.modifiedByAddress;
  }

  governorEntity.modifiedTime = event.block.timestamp;
  governorEntity.modifiedByAddress = event.params.modifiedByAddress;

  if (event.params.newStatus) {
    governorEntity.status = "ACTIVE";
    governorEntity.settlement = event.address.toHex();
  } else {
    governorEntity.status = "REMOVED";
    governorEntity.settlement = null;
  }

  governorEntity.save();

  const actionEntity = new GovernorStatusChangedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.settlement = event.address;
  actionEntity.currentGovernorsGeneration = event.params.currentGovernorsGeneration;
  actionEntity.governor = event.params.governorAddress;
  actionEntity.newStatus = event.params.newStatus;
  actionEntity.modifiedByAddress = event.params.modifiedByAddress;
  actionEntity.save();
}

export function handleGovernorsGenerationChanged(event: GovernorsGenerationChanged): void {
  const settlement = Settlement.load(event.address.toHex())!;
  settlement.currentGovernorsGeneration = event.params.newGovernorsGeneration;
  settlement.save();

  const actionEntity = new GovernorsGenerationChangedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.settlement = event.address;
  actionEntity.newGovernorsGeneration = event.params.newGovernorsGeneration;
  actionEntity.save();
}

export function handleDestroyed(event: Destroyed): void {
  const settlementEntity = Settlement.load(event.address.toHex())!;
  const cemPositionEntity = CemPosition.load(settlementEntity.position.toString())!;
  cemPositionEntity.settlement = null;
  cemPositionEntity.save();

  const actionEntity = new DestroyedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.oldSettlement = event.address;
  actionEntity.save();
}
