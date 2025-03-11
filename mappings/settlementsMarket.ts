import {SettlementBought, SettlementsMarket as SettlementsMarketContract} from "../generated/templates/SettlementsMarket/SettlementsMarket";
import {SettlementBoughtAction, WorldStatistic} from "../generated/schema";
import {createBlockNumberAndLogIndex} from "./_actions";
import {BigInt} from "@graphprotocol/graph-ts";

export function handleSettlementBought(event: SettlementBought): void {
    const settlementMarketContract = SettlementsMarketContract.bind(event.address);
    const worldAddress = settlementMarketContract.world().toHex();
    const worldStatistic = WorldStatistic.load(worldAddress)!;
    worldStatistic.totalCreatedSettlements = worldStatistic.totalCreatedSettlements.plus(BigInt.fromI32(1));
    worldStatistic.save();

    const actionEntity = new SettlementBoughtAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.settlement = event.params.settlementAddress;
    actionEntity.settlementCost = event.params.settlementCost;
    actionEntity.save();
}