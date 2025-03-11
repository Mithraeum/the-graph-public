import {
  CapturedTileClaimed, CapturedTileGivenUp,
  TileCapturingCancelled,
  TileCapturingBegan
} from "../generated/templates/TileCapturingSystem/TileCapturingSystem";
import {
  CapturedTileClaimedAction,
  CapturedTileGivenUpAction,
  TileCapturingBeganAction, TileCapturingCancelledAction,
  TileCapturingRecord,
  TileCapturingSystem,
  WorkersBoughtAction
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import {TileCapturingSystem as TileCapturingSystemContract} from "../generated/templates/TileCapturingSystem/TileCapturingSystem"
import {createBlockNumberAndLogIndex} from "./_actions";

function incrementTileCapturingSystemRecordCount(tileCapturingSystemAddress: string): void {
  const tileCapturingSystemEntity = TileCapturingSystem.load(tileCapturingSystemAddress)!;
  tileCapturingSystemEntity.tileCapturingRecordsCount = tileCapturingSystemEntity.tileCapturingRecordsCount.plus(BigInt.fromI32(1));
  tileCapturingSystemEntity.save();
}

export function handleTileCapturingBegan(event: TileCapturingBegan): void {
  const tileCapturingRecordEntity = new TileCapturingRecord(event.transaction.hash.toHex() + "_" + event.transactionLogIndex.toString());
  tileCapturingRecordEntity.tileCapturingSystem = event.address.toHex();
  tileCapturingRecordEntity.position = event.params.position;
  tileCapturingRecordEntity.settlement = event.params.settlementAddress.toHex();
  tileCapturingRecordEntity.prosperityStake = event.params.prosperityStake;
  tileCapturingRecordEntity.actionType = "STARTED";
  tileCapturingRecordEntity.time = event.block.timestamp;
  tileCapturingRecordEntity.save();

  incrementTileCapturingSystemRecordCount(event.address.toHex());

  const tileCapturingSystemContract = TileCapturingSystemContract.bind(event.address);
  const tileInfo = tileCapturingSystemContract.tilesInfo(event.params.position);

  const actionEntity = new TileCapturingBeganAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.contesterSettlement = event.params.settlementAddress;
  actionEntity.ownedBySettlement = tileInfo.getOwnerSettlementAddress();
  actionEntity.previousUsurperSettlement = event.params.previousUsurperAddress;
  actionEntity.position = event.params.position;
  actionEntity.prosperityStake = event.params.prosperityStake;
  actionEntity.captureBeginTime = event.params.captureBeginTime;
  actionEntity.captureEndTime = event.params.captureEndTime;
  actionEntity.save();
}

export function handleTileCapturingCancelled(event: TileCapturingCancelled): void {
  const tileCapturingRecordEntity = new TileCapturingRecord(event.transaction.hash.toHex() + "_" + event.transactionLogIndex.toString());
  tileCapturingRecordEntity.tileCapturingSystem = event.address.toHex();
  tileCapturingRecordEntity.position = event.params.position;
  tileCapturingRecordEntity.settlement = event.params.settlementAddress.toHex();
  tileCapturingRecordEntity.actionType = "CANCELLED";
  tileCapturingRecordEntity.time = event.block.timestamp;
  tileCapturingRecordEntity.save();

  incrementTileCapturingSystemRecordCount(event.address.toHex());

  const tileCapturingSystemContract = TileCapturingSystemContract.bind(event.address);
  const tileInfo = tileCapturingSystemContract.tilesInfo(event.params.position);

  const actionEntity = new TileCapturingCancelledAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.settlement = event.params.settlementAddress;
  actionEntity.ownedBySettlement = tileInfo.getOwnerSettlementAddress();
  actionEntity.position = event.params.position;
  actionEntity.save();
}

export function handleCapturedTileClaimed(event: CapturedTileClaimed): void {
  const tileCapturingRecordEntity = new TileCapturingRecord(event.transaction.hash.toHex() + "_" + event.transactionLogIndex.toString());
  tileCapturingRecordEntity.tileCapturingSystem = event.address.toHex();
  tileCapturingRecordEntity.position = event.params.position;
  tileCapturingRecordEntity.settlement = event.params.settlementAddress.toHex();
  tileCapturingRecordEntity.prosperityStake = event.params.prosperityStake;
  tileCapturingRecordEntity.actionType = "CLAIMED";
  tileCapturingRecordEntity.time = event.block.timestamp;
  tileCapturingRecordEntity.save();

  incrementTileCapturingSystemRecordCount(event.address.toHex());

  const actionEntity = new CapturedTileClaimedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.newSettlement = event.params.settlementAddress;
  actionEntity.oldSettlement = event.params.previousSettlementOwnerAddress;
  actionEntity.position = event.params.position;
  actionEntity.prosperityStake = event.params.prosperityStake;
  actionEntity.save();
}

export function handleCapturedTileGivenUp(event: CapturedTileGivenUp): void {
  const tileCapturingRecordEntity = new TileCapturingRecord(event.transaction.hash.toHex() + "_" + event.transactionLogIndex.toString());
  tileCapturingRecordEntity.tileCapturingSystem = event.address.toHex();
  tileCapturingRecordEntity.position = event.params.position;
  tileCapturingRecordEntity.settlement = event.params.settlementAddress.toHex();
  tileCapturingRecordEntity.actionType = "GIVEN_UP";
  tileCapturingRecordEntity.time = event.block.timestamp;
  tileCapturingRecordEntity.save();

  incrementTileCapturingSystemRecordCount(event.address.toHex());

  const actionEntity = new CapturedTileGivenUpAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
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
