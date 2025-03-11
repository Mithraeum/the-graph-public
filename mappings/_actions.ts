import {BigInt} from "@graphprotocol/graph-ts";

// Creates unique historical action identifier that can be used in actions ordering
// Uses upper 128 bits to represent blockNumber and lower 128 bits to represent logIndex
export function createBlockNumberAndLogIndex(blockNumber: BigInt, logIndex: BigInt): BigInt {
    return blockNumber.leftShift(128).plus(logIndex);
}