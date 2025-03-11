import {Transfer} from "../generated/templates/Workers/Workers";
import {WorkersTransferAction} from "../generated/schema";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleWorkersTransfer(event: Transfer): void {
    const actionEntity = new WorkersTransferAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.from = event.params.from;
    actionEntity.to = event.params.to;
    actionEntity.amount = event.params.value;
    actionEntity.save();
}