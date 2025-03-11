import {Transfer} from "../generated/Erc20ForSettlementPurchase/IERC20";
import {Erc20ForSettlementPurchaseTokenHolder} from "../generated/schema";
import {BigInt} from "@graphprotocol/graph-ts";

function isZeroAddress(address: string): boolean {
    return address == '0x0000000000000000000000000000000000000000';
}

export function handleErc20ForSettlementPurchaseTransfer(event: Transfer): void {
    if (!isZeroAddress(event.params.to.toHex())) {
        let toTokenHolder = Erc20ForSettlementPurchaseTokenHolder.load(event.params.to.toHex());
        if (toTokenHolder === null) {
            toTokenHolder = new Erc20ForSettlementPurchaseTokenHolder(event.params.to.toHex());
            toTokenHolder.balance = BigInt.fromI32(0);
        }

        toTokenHolder.balance = toTokenHolder.balance.plus(event.params.value);
        toTokenHolder.save();
    }

    if (!isZeroAddress(event.params.from.toHex())) {
        let fromTokenHolder = Erc20ForSettlementPurchaseTokenHolder.load(event.params.from.toHex());
        if (fromTokenHolder === null) {
            fromTokenHolder = new Erc20ForSettlementPurchaseTokenHolder(event.params.from.toHex());
            fromTokenHolder.balance = BigInt.fromI32(0);
        }

        fromTokenHolder.balance = fromTokenHolder.balance.minus(event.params.value);
        fromTokenHolder.save();
    }
}