import {Transfer} from "../generated/templates/Units/Units";
import {UnitsTransferAction} from "../generated/schema";
import {createBlockNumberAndLogIndex} from "./_actions";

export function handleUnitsTransfer(event: Transfer): void {
    const actionEntity = new UnitsTransferAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.units = event.address.toHex();
    actionEntity.from = event.params.from;
    actionEntity.to = event.params.to;
    actionEntity.amount = event.params.value;
    actionEntity.save();
}