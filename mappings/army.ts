import {BigInt, Bytes} from "@graphprotocol/graph-ts";
import {
    BattleCreated,
    JoinedBattle,
    ManeuveringBegan,
    SecretManeuverCancelled,
    UnitsDemilitarized,
    UpdatedPosition,
} from "../generated/templates/Army/Army";
import {
    Settlement,
    Army,
    Battle,
    ManeuveringBeganAction,
    SecretManeuverCancelledAction,
    UnitsDemilitarizedAction,
    BattleCreatedAction,
    JoinedBattleAction,
} from "../generated/schema";
import {Battle as BattleTemplate} from "../generated/templates";
import {Army as ArmyContract} from "../generated/templates/Army/Army";
import {Era as EraContract} from "../generated/templates/Era/Era";
import {createBlockNumberAndLogIndex} from "./_actions";

function isZeroAddress(address: string): boolean {
    return address == "0x0000000000000000000000000000000000000000";
}

export function handleManeuveringBegan(event: ManeuveringBegan): void {
    const army = Army.load(event.address.toHex())!;

    const armyContract = ArmyContract.bind(event.address);
    const currentPosition = armyContract.getCurrentPosition();
    const eraAddress = armyContract.era();
    const eraContract = EraContract.bind(eraAddress);
    const settlementOnCurrentPosition = eraContract.settlementByPosition(currentPosition);
    const settlementOnDestinationPosition = eraContract.settlementByPosition(event.params.position);

    if (!isZeroAddress(settlementOnDestinationPosition.toHex())) {
        army.destinationSettlement = settlementOnDestinationPosition.toHex();
    }

    if (!event.params.secretDestinationRegionId.equals(BigInt.fromI32(0))) {
        army.secretDestinationRegion = eraContract.regions(event.params.secretDestinationRegionId).toHex();
    }

    army.movementStartTime = event.params.beginTime;
    army.movementFinishTime = event.params.endTime;
    army.save();

    const actionEntity = new ManeuveringBeganAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.army = event.address;
    actionEntity.fromSettlement = settlementOnCurrentPosition;

    actionEntity.toSettlement = settlementOnDestinationPosition;
    actionEntity.position = event.params.position;
    actionEntity.secretDestinationRegionId = event.params.secretDestinationRegionId;
    actionEntity.secretDestinationPosition = event.params.secretDestinationPosition;
    actionEntity.beginTime = event.params.beginTime;
    actionEntity.endTime = event.params.endTime;
    actionEntity.tokensToSpendOnAcceleration = event.params.tokensToSpendOnAcceleration;
    actionEntity.save();
}

export function handleSecretManeuverCancelled(event: SecretManeuverCancelled): void {
    const army = Army.load(event.address.toHex())!;

    army.destinationSettlement = null;
    army.movementStartTime = null;
    army.movementFinishTime = null;
    army.save();

    const armyContract = ArmyContract.bind(event.address);
    const currentPosition = armyContract.getCurrentPosition();
    const eraAddress = armyContract.era();
    const eraContract = EraContract.bind(eraAddress);
    const settlementOnCurrentPosition = eraContract.settlementByPosition(currentPosition);

    const actionEntity = new SecretManeuverCancelledAction(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.army = event.address;
    actionEntity.fromSettlement = settlementOnCurrentPosition;
    actionEntity.save();
}

export function handleUnitsDemilitarized(event: UnitsDemilitarized): void {
    const armyContract = ArmyContract.bind(event.address);
    const currentPosition = armyContract.getCurrentPosition();
    const eraAddress = armyContract.era();
    const eraContract = EraContract.bind(eraAddress);
    const settlementOnCurrentPosition = eraContract.settlementByPosition(currentPosition);

    const actionEntity = new UnitsDemilitarizedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.army = event.address;
    actionEntity.onSettlement = settlementOnCurrentPosition;
    actionEntity.unitTypeIds = event.params.unitTypeIds;
    actionEntity.unitAmounts = event.params.unitsAmounts;
    actionEntity.save();
}

export function handleJoinedBattle(event: JoinedBattle): void {
    const battleEntity = Battle.load(event.params.battleAddress.toHex());

    if (battleEntity != null) {
        if (event.params.side.equals(BigInt.fromI32(1))) {
            const newSide1Armies = battleEntity.side1Armies;
            newSide1Armies.push(event.address);

            battleEntity.side1Armies = newSide1Armies;
        } else {
            const newSide2Armies = battleEntity.side2Armies;
            newSide2Armies.push(event.address);

            battleEntity.side2Armies = newSide2Armies;
        }

        battleEntity.save();
    }

    const actionEntity = new JoinedBattleAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.joinedArmy = event.address;
    actionEntity.side = event.params.side;
    actionEntity.battle = event.params.battleAddress;
    actionEntity.save();
}

export function handleUpdatedPosition(event: UpdatedPosition): void {
    const army = Army.load(event.address.toHex())!;
    const settlement = Settlement.load(event.params.settlementAddress.toHex())!;

    army.currentSettlement = settlement.id;
    army.destinationSettlement = null;
    army.movementStartTime = null;
    army.movementFinishTime = null;
    army.save();
}

export function handleBattleCreated(event: BattleCreated): void {
    BattleTemplate.create(event.params.battleAddress);

    const battle = new Battle(event.params.battleAddress.toHex());
    const army = Army.load(event.address.toHex())!;

    const side1Armies: Bytes[] = [];
    side1Armies.push(event.address);

    const side2Armies: Bytes[] = [];
    side2Armies.push(event.params.targetArmyAddress);

    battle.settlement = army.currentSettlement;
    battle.status = "ONGOING";
    battle.side1Armies = side1Armies;
    battle.side2Armies = side2Armies;
    battle.save();

    const actionEntity = new BattleCreatedAction(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    actionEntity.timestamp = event.block.timestamp;
    actionEntity.blockNumber = event.block.number;
    actionEntity.transactionHash = event.transaction.hash;
    actionEntity.transactionIndex = event.transaction.index;
    actionEntity.logIndex = event.logIndex;
    actionEntity.blockNumberAndLogIndex = createBlockNumberAndLogIndex(event.block.number, event.logIndex);

    actionEntity.attackerArmy = event.address;
    actionEntity.attackedArmy = event.params.targetArmyAddress;
    actionEntity.battle = event.params.battleAddress;
    actionEntity.save();
}
