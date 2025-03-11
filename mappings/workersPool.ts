import {WorkersBought, WorkersPool as WorkersPoolContract} from "../generated/templates/WorkersPool/WorkersPool";
import {BuildingRobbedAction, WorkersBoughtAction, WorkersPoolTransaction, WorldStatistic} from "../generated/schema";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleWorkersBought(event: WorkersBought): void {
  const workersPoolContract = WorkersPoolContract.bind(event.address);
  const worldAddress = workersPoolContract.world().toHex();
  const worldStatistic = WorldStatistic.load(worldAddress)!;
  worldStatistic.totalHiredWorkers = worldStatistic.totalHiredWorkers.plus(event.params.boughtWorkersAmount);
  worldStatistic.save();

  const workersPoolTransaction = new WorkersPoolTransaction(event.transaction.hash.toHex() + "_" + event.transactionLogIndex.toString());

  workersPoolTransaction.workersPool = event.address.toHex();
  workersPoolTransaction.txHash = event.transaction.hash;
  workersPoolTransaction.time = event.block.timestamp;
  workersPoolTransaction.settlement = event.params.buyerSettlementAddress.toHex();
  workersPoolTransaction.prosperitySpent = event.params.spentProsperityAmount;
  workersPoolTransaction.workersBought = event.params.boughtWorkersAmount;
  workersPoolTransaction.save();

  const actionEntity = new WorkersBoughtAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  actionEntity.timestamp = event.block.timestamp;
  actionEntity.blockNumber = event.block.number;
  actionEntity.transactionHash = event.transaction.hash;
  actionEntity.transactionIndex = event.transaction.index;
  actionEntity.logIndex = event.logIndex;
  actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

  actionEntity.settlement = event.params.buyerSettlementAddress;
  actionEntity.boughtWorkersAmount = event.params.boughtWorkersAmount;
  actionEntity.spentProsperityAmount = event.params.spentProsperityAmount;
  actionEntity.save();
}
