import {
    World,
    Resource,
    ResourceHolder,
    Era,
    Allowance,
    ResourceTransferAction
} from "../generated/schema";
import { Approval, Transfer } from "../generated/templates/Resource/Resource";
import {BigInt} from "@graphprotocol/graph-ts";
import {createBlockNumberAndLogIndex} from "./_actions";

function isZeroAddress(address: string): boolean {
    return address == '0x0000000000000000000000000000000000000000';
}

export function handleResourceTransfer(event: Transfer): void {
    const resourceEntity = Resource.load(event.address.toHex())!;
    const eraEntity = Era.load(resourceEntity.era)!;
    const worldEntity = World.load(eraEntity.world)!;

    const isFinishTimeInitialized = !worldEntity.gameFinishTime.equals(BigInt.fromI32(0));
    const isEventAfterFinishTime = event.block.timestamp.gt(worldEntity.gameFinishTime);
    if(isFinishTimeInitialized && isEventAfterFinishTime) {
        return;
    }

    if (!isZeroAddress(event.params.from.toHex())) {
        const resourceHolderId = event.address.toHex() + event.params.from.toHex();
        let resourceHolder = ResourceHolder.load(resourceHolderId);
        if (resourceHolder == null) {
            resourceHolder = new ResourceHolder(resourceHolderId);
            resourceHolder.resource = Resource.load(event.address.toHex())!.id;
            resourceHolder.amount = BigInt.fromI32(0);
            resourceHolder.address = event.params.from.toHex();

            resourceEntity.holdersCount = resourceEntity.holdersCount.plus(BigInt.fromI32(1));
        }

        resourceHolder.amount = resourceHolder.amount.minus(event.params.value);

        if (resourceHolder.amount.equals(BigInt.fromI32(0))) {
            resourceEntity.holdersCount = resourceEntity.holdersCount.minus(BigInt.fromI32(1));
        }

        resourceHolder.save();
    }


    if (!isZeroAddress(event.params.to.toHex())) {
        const resourceHolderId = event.address.toHex() + event.params.to.toHex();
        let resourceHolder = ResourceHolder.load(resourceHolderId);
        if (resourceHolder == null) {
            resourceHolder = new ResourceHolder(resourceHolderId);
            resourceHolder.resource = Resource.load(event.address.toHex())!.id;
            resourceHolder.amount = BigInt.fromI32(0);
            resourceHolder.address = event.params.to.toHex();

            resourceEntity.holdersCount = resourceEntity.holdersCount.plus(BigInt.fromI32(1));
        }

        resourceHolder.amount = resourceHolder.amount.plus(event.params.value);
        resourceHolder.save();
    }

    const actionEntity = new ResourceTransferAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.resource = event.address.toHex();
    actionEntity.from = event.params.from;
    actionEntity.to = event.params.to;
    actionEntity.amount = event.params.value;
    actionEntity.save();
}

export function handleApproval(event: Approval): void {
    const tokenAddress = event.address.toHex();
    const resourceEntity = Resource.load(tokenAddress)!;

    //tokenAddress + ownerAddress + spenderAddress
    const allowanceId = tokenAddress + event.params.owner.toHex() + event.params.spender.toHex();
    let allowanceEntity = Allowance.load(allowanceId);
    if (allowanceEntity == null) {
        allowanceEntity = new Allowance(allowanceId);
        allowanceEntity.resource = resourceEntity.id;
        allowanceEntity.owner = event.params.owner;
        allowanceEntity.spender = event.params.spender;
    }

    allowanceEntity.value = event.params.value;
    allowanceEntity.save();
}
