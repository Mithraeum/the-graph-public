import {
    SettlementsMarketCreated,
    CorruptionIndexDecreased,
    CorruptionIndexIncreased,
    UnitsPoolCreated,
    WorkersPoolCreated
} from "../generated/templates/Region/Region";

import {WorkersPool, Settlement, Region} from "../generated/schema";
import {WorkersPool as WorkerPoolTemplate} from "../generated/templates";
import {SettlementsMarket as SettlementsMarketTemplate} from "../generated/templates";
import {UnitsPool as UnitsPoolTemplate} from "../generated/templates";

function isZeroAddress(address: string): boolean {
    return address == '0x0000000000000000000000000000000000000000';
}

export function handleWorkersPoolCreated(event: WorkersPoolCreated): void {
    WorkerPoolTemplate.create(event.params.workersPoolAddress);

    const workersPoolEntity = new WorkersPool(event.params.workersPoolAddress.toHex());
    workersPoolEntity.region = event.address.toHex();
    workersPoolEntity.save();

    const regionEntity = Region.load(event.address.toHex())!;
    regionEntity.workersPool = workersPoolEntity.id;
    regionEntity.save();
}

export function handleUnitsPoolCreated(event: UnitsPoolCreated): void {
    UnitsPoolTemplate.create(event.params.unitsPoolAddress);
}

export function handleSettlementsMarketCreated(event: SettlementsMarketCreated): void {
    SettlementsMarketTemplate.create(event.params.settlementsMarketAddress);
}

export function handleCorruptionIndexIncreased(event: CorruptionIndexIncreased): void {
    if (isZeroAddress(event.params.settlementAddress.toHex())) {
        return;
    }

    const settlement = Settlement.load(event.params.settlementAddress.toHex())!;
    settlement.producedCorruptionIndex = settlement.producedCorruptionIndex!.plus(event.params.addedCorruptionIndexAmount);
    settlement.save();
}

export function handleCorruptionIndexDecreased(event: CorruptionIndexDecreased): void {
    if (isZeroAddress(event.params.settlementAddress.toHex())) {
        return;
    }

    const settlement = Settlement.load(event.params.settlementAddress.toHex())!;
    settlement.producedCorruptionIndex = settlement.producedCorruptionIndex!.minus(event.params.reducedCorruptionIndexAmount);
    settlement.save();
}
